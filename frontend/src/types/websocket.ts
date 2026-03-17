export const MessageTypes = {
  // Inbound
  SESSION_START: 'session:start',
  SESSION_KILL: 'session:kill',
  SESSION_INPUT: 'session:input',
  SESSION_RESIZE: 'session:resize',
  SESSION_LIST: 'session:list',
  SESSION_RECONNECT: 'session:reconnect',
  BROADCAST_INPUT: 'broadcast:input',

  // Outbound
  SESSION_STARTED: 'session:started',
  SESSION_OUTPUT: 'session:output',
  SESSION_ENDED: 'session:ended',
  SESSION_LIST_RESULT: 'session:list:result',
  SESSION_HISTORY: 'session:history',
  AVATAR_UPDATE: 'avatar:update',
  ERROR: 'error',
} as const

export type MessageType = typeof MessageTypes[keyof typeof MessageTypes]

export interface WsMessage {
  type: string
  sessionId?: string
  data?: string
  [key: string]: unknown
}
