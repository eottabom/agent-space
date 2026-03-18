import { useState, useRef, useEffect } from 'react'
import { Minus, X, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useTerminal } from '@/hooks/useTerminal'
import { AGENT_COLORS } from '@/lib/constants'
import { useSessionStore } from '@/store/sessionStore'
import type { Session } from '@/types/session'
import type { WsMessage } from '@/types/websocket'
import { ACTIVITY_REFRESH_MS, isSessionWorking } from '@/lib/session-activity'

interface TerminalCardProps {
  session: Session
  connected: boolean
  send: (msg: WsMessage) => void
  addHandler: (handler: (msg: WsMessage) => void) => () => void
  onKill: () => void
  onMinimize: () => void
}

export function TerminalCard({ session, connected, send, addHandler, onKill, onMinimize }: TerminalCardProps) {
  const { dispatch } = useSessionStore()
  const agentColor = AGENT_COLORS[session.agentId] || '#888'
  const isAlive = session.alive && session.state === 'RUNNING'
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!isAlive) {
      return
    }

    const interval = setInterval(() => setNow(Date.now()), ACTIVITY_REFRESH_MS)
    return () => clearInterval(interval)
  }, [isAlive])

  const { terminalRef } = useTerminal({ sessionId: session.id, connected, send, addHandler })

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const startEdit = () => {
    setEditValue(session.alias || '')
    setEditing(true)
  }

  const commitEdit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== session.alias) {
      dispatch({ type: 'UPDATE_SESSION', id: session.id, updates: { alias: trimmed } })
    }
    setEditing(false)
  }

  const isWorking = isSessionWorking(session, now)
  const statusLabel = !isAlive ? 'stopped' : isWorking ? 'working' : 'idle'
  const statusClass = !isAlive
    ? 'bg-gray-800 text-gray-500'
    : isWorking
      ? 'bg-green-900/50 text-green-400'
      : 'bg-orange-900/50 text-orange-400'

  return (
    <div className="flex flex-col rounded-lg border border-[#1e2a3a] bg-[#0a1018] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1e2a3a] bg-[#0d1520]">
        <button
          onClick={onMinimize}
          className="w-4 h-4 rounded border border-[#2a3a4a] bg-transparent flex items-center justify-center text-gray-500 hover:text-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
          title="Minimize"
        >
          <Minus className="w-2.5 h-2.5" />
        </button>
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: isAlive ? agentColor : '#555' }}
        />

        {/* Editable alias */}
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { commitEdit() }
              if (e.key === 'Escape') { setEditing(false) }
            }}
            className="text-xs font-semibold bg-[#1a2535] border border-[#2a3a4a] rounded px-1 py-0 outline-none w-28"
            style={{ color: agentColor }}
          />
        ) : (
          <span
            className="text-xs font-semibold cursor-pointer hover:underline group flex items-center gap-1"
            style={{ color: agentColor }}
            onClick={startEdit}
            title="Click to rename"
          >
            {session.alias || getAgentLabel(session.agentId)}
            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
          </span>
        )}

        <span className="text-[10px] text-gray-500 font-mono">
          {session.id.substring(0, 8)}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Badge className={cn("text-[10px] px-2 py-0 font-medium border-0", statusClass)}>
            {statusLabel}
          </Badge>
          <button
            onClick={onKill}
            className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1" style={{ minHeight: 350, background: '#0c1421' }}>
        <div className="w-full h-full" ref={terminalRef} />
      </div>
    </div>
  )
}

function getAgentLabel(id: string): string {
  const names: Record<string, string> = {
    claude: 'Claude Code',
    codex: 'Codex CLI',
    gemini: 'Gemini CLI',
    bash: 'Bash',
  }
  return names[id] || id
}
