import { Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FolderPicker } from '@/components/ui/folder-picker'
import { AGENTS } from '@/lib/constants'
import { AGENT_ICONS } from '@/components/icons/AgentIcons'

interface HeaderProps {
  connected: boolean
  cwd: string
  onCwdChange: (cwd: string) => void
  onAgentClick: (agentId: string) => void
}

export function Header({ connected, cwd, onCwdChange, onAgentClick }: HeaderProps) {
  return (
    <header className="h-14 border-b border-[#1e2a3a] bg-[#0d1520] flex items-center gap-3 px-4">
      <div className="flex items-center gap-2 mr-4">
        <Terminal className="w-5 h-5 text-blue-400" />
        <span className="text-sm font-bold text-white tracking-wide">AgentSpace</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            connected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
          }`}
        >
          {connected ? 'online' : 'offline'}
        </span>
      </div>

      <FolderPicker
        value={cwd}
        onChange={onCwdChange}
        placeholder="Working directory (optional)"
        className="max-w-[320px]"
        inputClassName="h-8 text-xs bg-[#1a2535] border-[#2a3a4a] text-gray-300 placeholder:text-gray-600"
        data-testid="cwd-input"
      />

      <div className="flex items-center gap-2 ml-auto">
        {AGENTS.map((agent) => (
          <Button
            key={agent.id}
            size="sm"
            className="h-8 text-xs font-medium px-3 gap-1.5"
            data-testid={`launch-agent-${agent.id}`}
            style={{
              backgroundColor: agent.color + '20',
              color: agent.color,
              borderColor: agent.color + '40',
              border: '1px solid',
            }}
            onClick={() => onAgentClick(agent.id)}
          >
            {AGENT_ICONS[agent.id]?.({ size: 14 })} {agent.label}
          </Button>
        ))}
      </div>
    </header>
  )
}
