import { useReducer, useState, useCallback, useEffect, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { AvatarLayer } from '@/components/avatar/AvatarLayer'
import { TerminalGrid } from '@/components/terminal/TerminalGrid'
import { CreateSessionModal, type SessionConfig } from '@/components/modal/CreateSessionModal'
import { useWebSocket } from '@/hooks/useWebSocket'
import { SessionContext, sessionReducer, initialSessionStore } from '@/store/sessionStore'
import { MessageTypes } from '@/types/websocket'
import type { WsMessage } from '@/types/websocket'
import type { Session, AvatarState } from '@/types/session'
import { ACTIVITY_REFRESH_MS, IDLE_THRESHOLD_MS, isSessionWorking } from '@/lib/session-activity'

function toSession(value: unknown): Session | null {
  if (typeof value !== 'object' || value === null) return null

  const sessionRecord = value as Record<string, unknown>
  if (typeof sessionRecord.id !== 'string' || typeof sessionRecord.agentId !== 'string') {
    return null
  }

  const state = typeof sessionRecord.state === 'string' ? sessionRecord.state : 'RUNNING'

  return {
    id: sessionRecord.id,
    agentId: sessionRecord.agentId,
    workspace: typeof sessionRecord.workspace === 'string' ? sessionRecord.workspace : 'default',
    cwd: typeof sessionRecord.cwd === 'string' ? sessionRecord.cwd : '',
    alias: typeof sessionRecord.alias === 'string' ? sessionRecord.alias : '',
    state: state as Session['state'],
    alive: typeof sessionRecord.alive === 'boolean' ? sessionRecord.alive : state === 'RUNNING',
    avatar: sessionRecord.avatar as Session['avatar'],
  }
}

const AVATAR_WALK_DURATION_MS = 8500

export default function App() {
  const [store, dispatch] = useReducer(sessionReducer, initialSessionStore)
  const { send, addHandler, connected } = useWebSocket()
  const [cwd, setCwd] = useState(() => localStorage.getItem('agentspace:cwd') || '')
  const [modalAgent, setModalAgent] = useState<string | null>(null)
  const removeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const handleCwdChange = useCallback((cwdValue: string) => {
    setCwd(cwdValue)
    localStorage.setItem('agentspace:cwd', cwdValue)
  }, [])

  useEffect(() => {
    const timers = removeTimers.current
    const remove = addHandler((message: WsMessage) => {
      switch (message.type) {
        case MessageTypes.SESSION_STARTED: {
          const now = Date.now()
          const session: Session = {
            id: message.sessionId as string,
            agentId: message.agentId as string,
            workspace: message.workspace as string,
            cwd: message.cwd as string,
            alias: message.alias as string,
            state: 'RUNNING',
            alive: true,
            lastOutputAt: now,
          }
          dispatch({ type: 'ADD_SESSION', session })
          break
        }
        case MessageTypes.SESSION_OUTPUT: {
          const sessionId = message.sessionId as string
          const now = Date.now()
          const currentSession = store.sessions.get(sessionId)
          const currentAvatar = store.avatars.get(sessionId)

          if (currentSession && now - (currentSession.lastOutputAt ?? 0) > 1000) {
            dispatch({ type: 'UPDATE_SESSION', id: sessionId, updates: { lastOutputAt: now } })
          }

          if (
            currentAvatar &&
            (currentAvatar.zone !== 'WORKING_ZONE' ||
              (currentAvatar.state !== 'WORKING' && currentAvatar.state !== 'THINKING'))
          ) {
            dispatch({
              type: 'UPDATE_AVATAR',
              avatar: {
                ...currentAvatar,
                state: 'WORKING',
                action: 'CODING',
                zone: 'WORKING_ZONE',
              },
            })
          }
          break
        }
        case MessageTypes.SESSION_ENDED: {
          const sid = message.sessionId as string
          dispatch({ type: 'UPDATE_SESSION', id: sid, updates: { state: 'STOPPED' } })
          dispatch({
            type: 'UPDATE_AVATAR',
            avatar: { sessionId: sid, state: 'IDLE', action: 'RESTING', message: '', zone: 'IDLE_ZONE' },
          })
          const timer = setTimeout(() => {
            dispatch({ type: 'REMOVE_SESSION', id: sid })
            removeTimers.current.delete(sid)
          }, AVATAR_WALK_DURATION_MS)
          removeTimers.current.set(sid, timer)
          break
        }
        case MessageTypes.SESSION_LIST_RESULT: {
          const rawSessions = Array.isArray(message.sessions) ? message.sessions : []
          const sessions: Session[] = rawSessions.flatMap((sessionValue) => {
            const session = toSession(sessionValue)
            return session ? [session] : []
          })

          dispatch({ type: 'SET_SESSIONS', sessions })
          for (const session of sessions) {
            if (session.avatar) {
              dispatch({ type: 'UPDATE_AVATAR', avatar: session.avatar })
            }
          }
          break
        }
        case MessageTypes.AVATAR_UPDATE:
          dispatch({
            type: 'UPDATE_AVATAR',
            avatar: {
              sessionId: message.sessionId as string,
              state: message.state as AvatarState['state'],
              action: message.action as AvatarState['action'],
              message: message.message as string,
              zone: message.zone as AvatarState['zone'],
            },
          })
          break
        case MessageTypes.ERROR:
          console.error('Server error:', message.message)
          break
      }
    })
    return () => {
      remove()
      timers.forEach(clearTimeout)
      timers.clear()
    }
  }, [addHandler, store.avatars, store.sessions])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()

      for (const session of store.sessions.values()) {
        const avatar = store.avatars.get(session.id)
        if (!avatar) {
          continue
        }

        if (!session.alive || session.state !== 'RUNNING') {
          continue
        }

        if (isSessionWorking(session, now)) {
          continue
        }

        if (avatar.zone === 'IDLE_ZONE' && avatar.state === 'IDLE' && avatar.action === 'RESTING') {
          continue
        }

        if (!session.lastOutputAt && now < IDLE_THRESHOLD_MS) {
          continue
        }

        dispatch({
          type: 'UPDATE_AVATAR',
          avatar: {
            ...avatar,
            state: 'IDLE',
            action: 'RESTING',
            zone: 'IDLE_ZONE',
          },
        })
      }
    }, ACTIVITY_REFRESH_MS)

    return () => clearInterval(interval)
  }, [store.avatars, store.sessions])

  useEffect(() => {
    if (connected) send({ type: MessageTypes.SESSION_LIST })
  }, [connected, send])

  const handleLaunchAgent = useCallback((config: SessionConfig) => {
    send({
      type: MessageTypes.SESSION_START,
      agentId: config.agentId,
      workspace: config.workspace,
      cwd: config.cwd,
      alias: config.alias,
      autoApprove: config.autoApprove,
      debug: config.debug,
      args: config.args,
    })
  }, [send])

  const handleKillSession = useCallback((id: string) => {
    const timer = removeTimers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      removeTimers.current.delete(id)
    }
    dispatch({ type: 'REMOVE_SESSION', id })
    try { send({ type: MessageTypes.SESSION_KILL, sessionId: id }) } catch { /* ignore */ }
  }, [send])

  return (
    <SessionContext.Provider value={{ store, dispatch }}>
      <div className="h-screen flex flex-col bg-[#080e17] text-gray-200">
        <Header
          connected={connected}
          cwd={cwd}
          onCwdChange={handleCwdChange}
          onAgentClick={(agentId) => setModalAgent(agentId)}
        />
        <AvatarLayer />
        <TerminalGrid
          connected={connected}
          send={send}
          addHandler={addHandler}
          onKill={handleKillSession}
        />
        {modalAgent && (
          <CreateSessionModal
            open={true}
            agentId={modalAgent}
            cwd={cwd}
            onClose={() => setModalAgent(null)}
            onSubmit={handleLaunchAgent}
          />
        )}
      </div>
    </SessionContext.Provider>
  )
}
