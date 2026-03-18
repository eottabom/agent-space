import type { IPty } from 'node-pty'
import type { WebSocket } from 'ws'
import type { SessionInfo, SessionState } from './types'

// 브라우저 재접속 시 복원할 출력 버퍼 최대 크기
const HISTORY_MAX_BYTES = 1024 * 1024 // 1 MB

export interface Session {
    id: string
    agentId: string
    workspace: string
    cwd: string
    alias: string
    state: SessionState
    alive: boolean
    pty: IPty | null
    /** 누적 PTY 출력 — 재접속 시 history 로 전송 */
    history: string
    /** 이 세션의 출력을 구독 중인 WebSocket 클라이언트 */
    subscribers: Set<WebSocket>
}

export class SessionRegistry {
    private readonly sessions = new Map<string, Session>()

    create(params: Omit<Session, 'history' | 'subscribers'>): Session {
        const session: Session = {
            ...params,
            history: '',
            subscribers: new Set(),
        }
        this.sessions.set(session.id, session)
        return session
    }

    get(id: string): Session | undefined {
        return this.sessions.get(id)
    }

    getAll(): Session[] {
        return Array.from(this.sessions.values())
    }

    appendHistory(sessionId: string, data: string): void {
        const session = this.sessions.get(sessionId)
        if (!session) {
            return
        }
        session.history += data
        if (session.history.length > HISTORY_MAX_BYTES) {
            // 오래된 부분을 제거하여 최대 크기 유지
            session.history = session.history.slice(-HISTORY_MAX_BYTES)
        }
    }

    subscribe(sessionId: string, ws: WebSocket): void {
        this.sessions.get(sessionId)?.subscribers.add(ws)
    }

    /** 연결이 끊긴 클라이언트를 모든 세션 구독자 목록에서 제거 */
    unsubscribe(ws: WebSocket): void {
        for (const session of this.sessions.values()) {
            session.subscribers.delete(ws)
        }
    }

    toSessionInfo(session: Session): SessionInfo {
        return {
            id: session.id,
            agentId: session.agentId,
            workspace: session.workspace,
            cwd: session.cwd,
            alias: session.alias,
            state: session.state,
            alive: session.alive,
        }
    }
}
