export type SessionState = 'CREATED' | 'RUNNING' | 'STOPPED' | 'ERROR'

export interface Session {
  id: string
  agentId: string
  workspace: string
  cwd: string
  alias: string
  state: SessionState
  alive: boolean
  lastOutputAt?: number
  avatar?: AvatarState
}

export type AvatarStateName = 'IDLE' | 'MOVING' | 'WORKING' | 'THINKING' | 'ERROR'
export type AvatarActionName = 'CODING' | 'WATERING' | 'CHOPPING' | 'DIGGING' | 'WALKING' | 'THINKING' | 'RESTING'
export type AvatarZoneName = 'IDLE_ZONE' | 'WORKING_ZONE'

export interface AvatarState {
  sessionId: string
  state: AvatarStateName
  action: AvatarActionName
  message: string
  zone: AvatarZoneName
}

export interface CreateSessionRequest {
  agentId: string
  workspace: string
  cwd: string
  autoApprove: boolean
  debug: boolean
  args: string[]
}
