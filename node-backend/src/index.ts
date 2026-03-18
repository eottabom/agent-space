import { createServer } from 'http'
import { execSync } from 'child_process'
import path from 'path'
import express from 'express'
import { WebSocket, WebSocketServer } from 'ws'
import * as pty from 'node-pty'
import { v4 as uuidv4 } from 'uuid'
import { SessionRegistry } from './sessionRegistry'
import { resolveCommand } from './agentResolver'
import type {
    ClientMsg,
    SessionStartMsg,
    SessionInputMsg,
    SessionResizeMsg,
    SessionKillMsg,
    SessionReconnectMsg,
    BroadcastInputMsg,
    ServerMsg,
} from './types'

const DEFAULT_PORT = parseInt(process.env.PORT ?? '3000', 10)

/**
 * 프론트엔드 dist 경로를 실행 환경에 따라 결정한다.
 * - 환경 변수 FRONTEND_DIST 가 있으면 우선 사용
 * - electron-builder 패키징 환경: process.resourcesPath 하위
 * - 개발/단독 실행: __dirname 기준 상대 경로
 */
function resolveFrontendDist(): string {
    if (process.env.FRONTEND_DIST) {
        return process.env.FRONTEND_DIST
    }
    // electron-builder 패키징 시 extraResources 로 복사된 경로
    const electronProcess = process as NodeJS.Process & { resourcesPath?: string }
    if (electronProcess.resourcesPath) {
        return path.join(electronProcess.resourcesPath, 'frontend', 'dist')
    }
    return path.resolve(__dirname, '../../frontend/dist')
}

const FRONTEND_DIST = resolveFrontendDist()
const LOGIN_SHELL = process.env.SHELL || '/bin/bash'

/**
 * 패키징된 Electron 앱은 Finder 에서 실행 시 PATH 가 매우 제한적이다.
 * 로그인 쉘을 통해 사용자의 실제 PATH 를 가져와 process.env 에 보강한다.
 */
function ensureFullPath(): void {
    try {
        const shellPath = execSync(`${LOGIN_SHELL} -l -c 'echo $PATH'`, {
            encoding: 'utf8',
            timeout: 5000,
        }).trim()
        if (shellPath) {
            process.env.PATH = shellPath
        }
    } catch {
        // 실패 시 기존 PATH 유지
    }
}

ensureFullPath()

/**
 * 로그인 쉘을 통해 커맨드의 절대 경로를 조회한다.
 * Node.js 프로세스 PATH 와 인터랙티브 쉘 PATH 가 다를 때 (nvm, homebrew 등)
 * posix_spawnp 실패를 방지하기 위해 사용한다.
 */
function resolveCommandPath(command: string): string {
    if (command.startsWith('/')) {
        return command
    }
    try {
        const resolved = execSync(`${LOGIN_SHELL} -l -c 'which ${command}'`, {
            encoding: 'utf8',
            env: process.env,
            timeout: 3000,
        }).trim()
        return resolved || command
    } catch {
        // which 실패 시 원래 커맨드 그대로 반환 — PTY 단계에서 에러 처리
        return command
    }
}
const DEFAULT_COLS = 80
const DEFAULT_ROWS = 24

const app = express()
const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer, path: '/ws' })
const registry = new SessionRegistry()

// 정적 파일 서빙 — 빌드된 프론트엔드를 동일 포트에서 제공
app.use(express.static(FRONTEND_DIST))
app.get('*', (_req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'))
})

// 전체 연결 클라이언트에게 메시지 브로드캐스트
function broadcast(msg: ServerMsg): void {
    const json = JSON.stringify(msg)
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(json)
        }
    })
}

// 특정 클라이언트에게 메시지 전송
function sendTo(ws: WebSocket, msg: ServerMsg): void {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg))
    }
}

// 세션 구독자 전체에게 브로드캐스트
function broadcastToSession(sessionId: string, msg: ServerMsg): void {
    const session = registry.get(sessionId)
    if (!session) {
        return
    }
    const json = JSON.stringify(msg)
    session.subscribers.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(json)
        }
    })
}

// WebSocket 연결 처리
wss.on('connection', (ws: WebSocket) => {
    console.log('[WS] 클라이언트 연결됨')

    ws.on('close', () => {
        console.log('[WS] 클라이언트 연결 종료')
        registry.unsubscribe(ws)
    })

    ws.on('message', (raw: Buffer | string) => {
        let msg: ClientMsg
        try {
            msg = JSON.parse(raw.toString()) as ClientMsg
        } catch {
            sendTo(ws, { type: 'error', message: 'JSON 파싱 실패' })
            return
        }
        handleMessage(ws, msg)
    })
})

function handleMessage(ws: WebSocket, msg: ClientMsg): void {
    switch (msg.type) {
        case 'session:start':
            handleStart(ws, msg)
            break
        case 'session:input':
            handleInput(ws, msg)
            break
        case 'session:resize':
            handleResize(msg)
            break
        case 'session:kill':
            handleKill(msg)
            break
        case 'session:list':
            handleList(ws)
            break
        case 'session:reconnect':
            handleReconnect(ws, msg)
            break
        case 'broadcast:input':
            handleBroadcastInput(msg)
            break
        default: {
            const unknownMsg = msg as { type: string }
            sendTo(ws, { type: 'error', message: `알 수 없는 메시지 타입: ${unknownMsg.type}` })
        }
    }
}

function handleStart(ws: WebSocket, msg: SessionStartMsg): void {
    const {
        agentId,
        workspace = 'default',
        cwd = process.cwd(),
        alias,
        autoApprove = false,
        debug = false,
        args = [],
    } = msg

    const sessionId = uuidv4()
    const shortId = sessionId.substring(0, 4)
    const sessionAlias = alias ?? `${agentId}-${shortId}`

    const { command, args: cmdArgs } = resolveCommand(agentId, autoApprove, debug, args)
    const resolvedCommand = resolveCommandPath(command)
    console.log(`[세션] 시작: ${agentId} / cwd=${cwd} / 명령어: ${resolvedCommand} ${cmdArgs.join(' ')}`)

    let ptyProcess: pty.IPty
    try {
        ptyProcess = pty.spawn(resolvedCommand, cmdArgs, {
            name: 'xterm-256color',
            cols: DEFAULT_COLS,
            rows: DEFAULT_ROWS,
            cwd,
            // 호스트 환경 변수를 그대로 상속
            env: process.env as Record<string, string>,
        })
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`[세션] PTY 생성 실패: ${errorMessage}`)
        sendTo(ws, { type: 'error', message: `세션 시작 실패: ${errorMessage}` })
        return
    }

    const session = registry.create({
        id: sessionId,
        agentId,
        workspace,
        cwd,
        alias: sessionAlias,
        state: 'RUNNING',
        alive: true,
        pty: ptyProcess,
    })

    // 세션 생성자를 구독자로 등록
    registry.subscribe(sessionId, ws)

    broadcast({ type: 'session:started', sessionId, agentId, workspace, cwd, alias: sessionAlias })
    broadcast({
        type: 'avatar:update',
        sessionId,
        state: 'THINKING',
        action: 'THINKING',
        message: `${agentId} 시작됨`,
        zone: 'WORKING_ZONE',
    })

    ptyProcess.onData((data: string) => {
        // PTY 출력을 base64 인코딩하여 구독자에게 전송
        const b64 = Buffer.from(data).toString('base64')
        registry.appendHistory(sessionId, data)
        broadcastToSession(sessionId, { type: 'session:output', sessionId, data: b64 })
    })

    ptyProcess.onExit(({ exitCode }) => {
        console.log(`[세션] 종료: ${sessionId} (exitCode=${exitCode})`)
        const s = registry.get(sessionId)
        if (s) {
            s.alive = false
            s.state = 'STOPPED'
            s.pty = null
        }
        broadcast({ type: 'session:ended', sessionId })
        broadcast({
            type: 'avatar:update',
            sessionId,
            state: 'IDLE',
            action: 'RESTING',
            message: `${agentId} 종료됨`,
            zone: 'IDLE_ZONE',
        })
    })

    void session
}

function handleInput(ws: WebSocket, msg: SessionInputMsg): void {
    const session = registry.get(msg.sessionId)
    if (!session?.pty || !session.alive) {
        sendTo(ws, { type: 'error', message: `세션을 찾을 수 없거나 종료됨: ${msg.sessionId}` })
        return
    }
    // base64 디코딩 후 PTY 에 쓰기
    const decoded = Buffer.from(msg.data, 'base64').toString()
    session.pty.write(decoded)
}

function handleResize(msg: SessionResizeMsg): void {
    const session = registry.get(msg.sessionId)
    if (!session?.pty || !session.alive) {
        return
    }
    try {
        session.pty.resize(msg.cols, msg.rows)
    } catch (err: unknown) {
        console.error(`[리사이즈] 실패: ${err}`)
    }
}

function handleKill(msg: SessionKillMsg): void {
    const session = registry.get(msg.sessionId)
    if (!session?.pty) {
        return
    }
    try {
        session.pty.kill()
    } catch (err: unknown) {
        console.error(`[종료] PTY kill 실패: ${err}`)
    }
}

function handleList(ws: WebSocket): void {
    const sessions = registry.getAll().map(s => registry.toSessionInfo(s))
    sendTo(ws, { type: 'session:list:result', sessions })
}

function handleReconnect(ws: WebSocket, msg: SessionReconnectMsg): void {
    const session = registry.get(msg.sessionId)
    if (!session) {
        sendTo(ws, { type: 'error', message: `세션을 찾을 수 없음: ${msg.sessionId}` })
        return
    }

    // 재접속 클라이언트를 구독자로 등록
    registry.subscribe(msg.sessionId, ws)

    // 누적된 history 전송 — 브라우저 리로드 후 터미널 복원에 사용
    if (session.history.length > 0) {
        const b64 = Buffer.from(session.history).toString('base64')
        sendTo(ws, { type: 'session:history', sessionId: msg.sessionId, data: b64 })
    }
}

function handleBroadcastInput(msg: BroadcastInputMsg): void {
    const decoded = Buffer.from(msg.data, 'base64').toString()
    // sessionIds 가 없으면 전체 활성 세션에 전송
    const targetIds = msg.sessionIds ?? registry.getAll().map(s => s.id)

    for (const sessionId of targetIds) {
        const session = registry.get(sessionId)
        if (session?.pty && session.alive) {
            session.pty.write(decoded)
        }
    }
}

/**
 * HTTP 서버를 시작하고 실제 바인딩된 포트를 반환한다.
 * Electron main process 와 단독 실행 모두에서 호출한다.
 */
export function startServer(port = DEFAULT_PORT): Promise<number> {
    return new Promise((resolve, reject) => {
        httpServer.once('error', reject)
        httpServer.listen(port, () => {
            const addr = httpServer.address()
            const boundPort = typeof addr === 'object' && addr ? addr.port : port
            console.log(`[AgentSpace] 서버 실행 중 → http://localhost:${boundPort}`)
            console.log(`[AgentSpace] WebSocket   → ws://localhost:${boundPort}/ws`)
            console.log(`[AgentSpace] 프론트엔드  → ${FRONTEND_DIST}`)
            resolve(boundPort)
        })
    })
}

// 단독 실행 시 (node dist/index.js)
if (require.main === module) {
    startServer().catch(err => {
        console.error('[AgentSpace] 서버 시작 실패:', err)
        process.exit(1)
    })
}
