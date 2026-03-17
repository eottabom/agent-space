import { Maximize2, X } from 'lucide-react'
import { AGENT_COLORS } from '@/lib/constants'
import type { Session } from '@/types/session'

const IDLE_THRESHOLD_MS = 5000

interface MinimizedDockProps {
  sessions: Session[]
  onRestore: (id: string) => void
  onKill: (id: string) => void
}

function getActivityStatus(session: Session): { label: string; color: string } {
  const isAlive = session.alive && session.state === 'RUNNING'
  if (!isAlive) {
    return { label: 'stopped', color: '#6b7280' }
  }
  const isWorking = session.lastOutputAt && (Date.now() - session.lastOutputAt < IDLE_THRESHOLD_MS)
  return isWorking
    ? { label: 'working', color: '#4ade80' }
    : { label: 'idle', color: '#fb923c' }
}

export function MinimizedDock({ sessions, onRestore, onKill }: MinimizedDockProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-[#1e2a3a] bg-[#0a1018]">
      {sessions.map(session => {
        const agentColor = AGENT_COLORS[session.agentId] || '#888'
        const isAlive = session.alive && session.state === 'RUNNING'
        const activity = getActivityStatus(session)
        return (
          <div
            key={session.id}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#1e2a3a] bg-[#0d1520] hover:bg-[#131d2b] transition-colors cursor-pointer group"
            onClick={() => onRestore(session.id)}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: isAlive ? agentColor : '#555' }}
            />
            <span className="text-[10px] font-semibold" style={{ color: agentColor }}>
              {session.alias || session.agentId}
            </span>
            <span className="text-[9px] font-medium" style={{ color: activity.color }}>
              {activity.label}
            </span>
            <Maximize2 className="w-3 h-3 text-gray-600 group-hover:text-gray-400 ml-1" />
            <button
              onClick={(e) => { e.stopPropagation(); onKill(session.id) }}
              className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
