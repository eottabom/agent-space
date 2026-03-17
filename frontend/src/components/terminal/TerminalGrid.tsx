import { useState, useCallback, useEffect } from 'react'
import { TerminalCard } from './TerminalCard'
import { MinimizedDock } from './MinimizedDock'
import { useSessionStore } from '@/store/sessionStore'
import type { WsMessage } from '@/types/websocket'

interface TerminalGridProps {
  connected: boolean
  send: (msg: WsMessage) => void
  addHandler: (handler: (msg: WsMessage) => void) => () => void
  onKill: (id: string) => void
}

export function TerminalGrid({ connected, send, addHandler, onKill }: TerminalGridProps) {
  const { store } = useSessionStore()
  const [minimizedIds, setMinimizedIds] = useState<Set<string>>(new Set())

  const sessions = Array.from(store.sessions.values()).filter(s => s.alive || s.state === 'RUNNING')

  useEffect(() => {
    setMinimizedIds(prev => {
      const alive = new Set(sessions.map(s => s.id))
      const next = new Set([...prev].filter(id => alive.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [sessions.length])

  const activeSessions = sessions.filter(s => !minimizedIds.has(s.id))
  const minimizedSessions = sessions.filter(s => minimizedIds.has(s.id))

  const handleMinimize = useCallback((id: string) => {
    setMinimizedIds(prev => new Set(prev).add(id))
  }, [])

  const handleRestore = useCallback((id: string) => {
    setMinimizedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const [showKillConfirm, setShowKillConfirm] = useState(false)

  const handleKillAll = useCallback(() => {
    sessions.forEach(s => onKill(s.id))
    setShowKillConfirm(false)
  }, [sessions, onKill])

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600">
        <p className="text-sm">Launch an agent from the toolbar above</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 터미널 헤더 — 전체 닫기 버튼 */}
      {sessions.length > 1 && (
        <div className="flex justify-end px-4 pt-2">
          <button
            onClick={() => setShowKillConfirm(true)}
            className="text-[10px] text-gray-500 hover:text-red-400 transition-colors px-2 py-0.5 rounded border border-[#1a2535] hover:border-red-400/30"
          >
            Kill All ({sessions.length})
          </button>
        </div>
      )}

      {/* Kill All 확인 모달 */}
      {showKillConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#0d1520] border border-[#1e2a3a] rounded-lg p-5 max-w-sm mx-4">
            <p className="text-sm text-gray-200 mb-1">전체 터미널 종료</p>
            <p className="text-xs text-gray-500 mb-4">
              실행 중인 {sessions.length}개의 세션을 모두 종료합니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowKillConfirm(false)}
                className="text-xs px-3 py-1.5 rounded border border-[#1e2a3a] text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleKillAll}
                className="text-xs px-3 py-1.5 rounded bg-red-600/80 text-white hover:bg-red-500 transition-colors"
              >
                전체 종료
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Active terminals */}
      <div className="flex-1 p-4 overflow-auto">
        {activeSessions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600">
            <p className="text-sm">All sessions minimized</p>
          </div>
        ) : (
          <div className={
            activeSessions.length === 1
              ? "grid grid-cols-1 gap-4"
              : "grid grid-cols-1 lg:grid-cols-2 gap-4"
          }>
            {activeSessions.map(session => (
              <TerminalCard
                key={session.id}
                session={session}
                connected={connected}
                send={send}
                addHandler={addHandler}
                onKill={() => onKill(session.id)}
                onMinimize={() => handleMinimize(session.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Minimized dock - bottom left */}
      {minimizedSessions.length > 0 && (
        <MinimizedDock
          sessions={minimizedSessions}
          onRestore={handleRestore}
          onKill={onKill}
        />
      )}
    </div>
  )
}
