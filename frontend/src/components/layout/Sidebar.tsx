import { Bot, Terminal, X, Sparkles, Hash } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/store/sessionStore'
import { AGENT_COLORS } from '@/lib/constants'
import type { Session } from '@/types/session'

interface SidebarProps {
  onKillSession: (id: string) => void
  onSelectSession: (id: string) => void
  activeSessionId: string | null
}

const agentIcons: Record<string, React.ReactNode> = {
  claude: <Bot className="w-3.5 h-3.5" />,
  codex: <Terminal className="w-3.5 h-3.5" />,
  gemini: <Sparkles className="w-3.5 h-3.5" />,
  bash: <Hash className="w-3.5 h-3.5" />,
}

export function Sidebar({ onKillSession, onSelectSession, activeSessionId }: SidebarProps) {
  const { store } = useSessionStore()
  const sessions = Array.from(store.sessions.values())

  // Group by workspace
  const workspaces = new Map<string, Session[]>()
  for (const session of sessions) {
    const ws = session.workspace || 'default'
    if (!workspaces.has(ws)) workspaces.set(ws, [])
    workspaces.get(ws)!.push(session)
  }

  return (
    <aside className="w-56 border-r bg-background flex flex-col">
      <div className="p-3 border-b">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Workspaces
        </h2>
      </div>
      <ScrollArea className="flex-1 p-2">
        {workspaces.size === 0 && (
          <p className="text-xs text-muted-foreground p-2">No active sessions</p>
        )}
        {Array.from(workspaces.entries()).map(([workspace, wsSessions]) => (
          <div key={workspace} className="mb-3">
            <div className="flex items-center gap-1.5 px-2 py-1">
              <span className="text-xs font-medium text-muted-foreground">{workspace}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {wsSessions.length}
              </Badge>
            </div>
            {wsSessions.map(session => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors",
                  activeSessionId === session.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
              >
                <span
                  className="flex-shrink-0"
                  style={{ color: AGENT_COLORS[session.agentId] || '#888' }}
                >
                  {agentIcons[session.agentId] || <Terminal className="w-3.5 h-3.5" />}
                </span>
                <span className="flex-1 truncate">{session.alias}</span>
                <Badge
                  variant={session.state === 'RUNNING' ? 'default' : 'secondary'}
                  className="text-[9px] px-1 py-0"
                >
                  {session.alive ? 'live' : session.state.toLowerCase()}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:opacity-100 flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); onKillSession(session.id) }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </button>
            ))}
          </div>
        ))}
      </ScrollArea>
    </aside>
  )
}
