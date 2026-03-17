import { createContext, useContext } from 'react'
import type { Session, AvatarState } from '@/types/session'

const CACHE_KEY = 'agentspace:store'

export interface SessionStore {
  sessions: Map<string, Session>
  avatars: Map<string, AvatarState>
  selectedIds: Set<string>
  activeWorkspace: string | null
}

export type SessionAction =
  | { type: 'SET_SESSIONS'; sessions: Session[] }
  | { type: 'ADD_SESSION'; session: Session }
  | { type: 'UPDATE_SESSION'; id: string; updates: Partial<Session> }
  | { type: 'REMOVE_SESSION'; id: string }
  | { type: 'UPDATE_AVATAR'; avatar: AvatarState }
  | { type: 'TOGGLE_SELECT'; id: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_WORKSPACE'; workspace: string | null }

function serializeStore(store: SessionStore): string {
  return JSON.stringify({
    sessions: Array.from(store.sessions.values()),
    avatars: Array.from(store.avatars.values()),
    activeWorkspace: store.activeWorkspace,
  })
}

function deserializeStore(): SessionStore | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    const sessions = new Map<string, Session>()
    const avatars = new Map<string, AvatarState>()
    if (Array.isArray(data.sessions)) {
      data.sessions.forEach((s: Session) => sessions.set(s.id, s))
    }
    if (Array.isArray(data.avatars)) {
      data.avatars.forEach((a: AvatarState) => avatars.set(a.sessionId, a))
    }
    return {
      sessions,
      avatars,
      selectedIds: new Set(),
      activeWorkspace: data.activeWorkspace || null,
    }
  } catch {
    return null
  }
}

function persistStore(store: SessionStore) {
  try {
    localStorage.setItem(CACHE_KEY, serializeStore(store))
  } catch {
    // quota exceeded or other error, ignore
  }
}

const cached = deserializeStore()

export const initialSessionStore: SessionStore = cached || {
  sessions: new Map(),
  avatars: new Map(),
  selectedIds: new Set(),
  activeWorkspace: null,
}

export function sessionReducer(state: SessionStore, action: SessionAction): SessionStore {
  let next: SessionStore
  switch (action.type) {
    case 'SET_SESSIONS': {
      const sessions = new Map<string, Session>()
      action.sessions.forEach(s => sessions.set(s.id, s))
      // Clean up avatars for sessions that no longer exist
      const avatars = new Map(state.avatars)
      for (const key of avatars.keys()) {
        if (!sessions.has(key)) avatars.delete(key)
      }
      next = { ...state, sessions, avatars }
      break
    }
    case 'ADD_SESSION': {
      const sessions = new Map(state.sessions)
      sessions.set(action.session.id, action.session)
      next = { ...state, sessions }
      break
    }
    case 'UPDATE_SESSION': {
      const sessions = new Map(state.sessions)
      const existing = sessions.get(action.id)
      if (existing) {
        sessions.set(action.id, { ...existing, ...action.updates })
      }
      next = { ...state, sessions }
      break
    }
    case 'REMOVE_SESSION': {
      const sessions = new Map(state.sessions)
      sessions.delete(action.id)
      const avatars = new Map(state.avatars)
      avatars.delete(action.id)
      next = { ...state, sessions, avatars }
      break
    }
    case 'UPDATE_AVATAR': {
      const avatars = new Map(state.avatars)
      avatars.set(action.avatar.sessionId, action.avatar)
      next = { ...state, avatars }
      break
    }
    case 'TOGGLE_SELECT': {
      const selectedIds = new Set(state.selectedIds)
      if (selectedIds.has(action.id)) {
        selectedIds.delete(action.id)
      } else {
        selectedIds.add(action.id)
      }
      return { ...state, selectedIds }
    }
    case 'CLEAR_SELECTION':
      return { ...state, selectedIds: new Set() }
    case 'SET_WORKSPACE':
      next = { ...state, activeWorkspace: action.workspace }
      break
    default:
      return state
  }
  persistStore(next)
  return next
}

export interface SessionContextType {
  store: SessionStore
  dispatch: React.Dispatch<SessionAction>
}

export const SessionContext = createContext<SessionContextType | null>(null)

export function useSessionStore() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSessionStore must be used within SessionProvider')
  return ctx
}
