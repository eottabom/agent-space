export type SessionState = 'CREATED' | 'RUNNING' | 'STOPPED' | 'ERROR'

export interface SessionInfo {
    id: string
    agentId: string
    workspace: string
    cwd: string
    alias: string
    state: SessionState
    alive: boolean
}

// 클라이언트 → 서버 메시지

export interface SessionStartMsg {
    type: 'session:start'
    agentId: string
    workspace?: string
    cwd?: string
    alias?: string
    autoApprove?: boolean
    debug?: boolean
    args?: string[]
}

export interface SessionInputMsg {
    type: 'session:input'
    sessionId: string
    data: string // base64
}

export interface SessionResizeMsg {
    type: 'session:resize'
    sessionId: string
    cols: number
    rows: number
}

export interface SessionKillMsg {
    type: 'session:kill'
    sessionId: string
}

export interface SessionListMsg {
    type: 'session:list'
}

export interface SessionReconnectMsg {
    type: 'session:reconnect'
    sessionId: string
}

export interface SessionUpdateMsg {
    type: 'session:update'
    sessionId: string
    updates: {
        alias?: string
    }
}

export interface BroadcastInputMsg {
    type: 'broadcast:input'
    data: string // base64
    sessionIds?: string[]
}

export type ClientMsg =
    | SessionStartMsg
    | SessionInputMsg
    | SessionResizeMsg
    | SessionKillMsg
    | SessionListMsg
    | SessionReconnectMsg
    | SessionUpdateMsg
    | BroadcastInputMsg

// 서버 → 클라이언트 메시지

export interface SessionStartedMsg {
    type: 'session:started'
    sessionId: string
    agentId: string
    workspace: string
    cwd: string
    alias: string
}

export interface SessionOutputMsg {
    type: 'session:output'
    sessionId: string
    data: string // base64
}

export interface SessionEndedMsg {
    type: 'session:ended'
    sessionId: string
}

export interface SessionListResultMsg {
    type: 'session:list:result'
    sessions: SessionInfo[]
}

export interface SessionHistoryMsg {
    type: 'session:history'
    sessionId: string
    data: string // base64
}

export interface AvatarUpdateMsg {
    type: 'avatar:update'
    sessionId: string
    state: string
    action: string
    message: string
    zone: string
}

export interface ErrorMsg {
    type: 'error'
    message: string
}

export type ServerMsg =
    | SessionStartedMsg
    | SessionOutputMsg
    | SessionEndedMsg
    | SessionListResultMsg
    | SessionHistoryMsg
    | AvatarUpdateMsg
    | ErrorMsg
