import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FolderPicker } from '@/components/ui/folder-picker'
import { Switch } from '@/components/ui/switch'
import { AGENT_COLORS } from '@/lib/constants'

interface CreateSessionModalProps {
  open: boolean
  agentId: string
  cwd: string
  onClose: () => void
  onSubmit: (config: SessionConfig) => void
}

export interface SessionConfig {
  agentId: string
  workspace: string
  cwd: string
  alias: string
  autoApprove: boolean
  debug: boolean
  args: string[]
}

const AGENT_OPTIONS: Record<string, { autoApproveLabel: string; autoApproveDesc: string; debugLabel: string }> = {
  claude: {
    autoApproveLabel: 'Skip Permissions',
    autoApproveDesc: '--dangerously-skip-permissions',
    debugLabel: '--verbose',
  },
  codex: {
    autoApproveLabel: 'Full Auto',
    autoApproveDesc: '--full-auto',
    debugLabel: '--debug',
  },
  gemini: {
    autoApproveLabel: 'YOLO Mode',
    autoApproveDesc: '--yolo',
    debugLabel: '--debug',
  },
  bash: {
    autoApproveLabel: 'Login Shell',
    autoApproveDesc: '-l flag',
    debugLabel: 'Verbose (-x)',
  },
}

export function CreateSessionModal({ open, agentId, cwd: defaultCwd, onClose, onSubmit }: CreateSessionModalProps) {
  const [cwd, setCwd] = useState(defaultCwd)
  const [alias, setAlias] = useState('')
  const [autoApprove, setAutoApprove] = useState(false)
  const [debug, setDebug] = useState(false)
  const [argsStr, setArgsStr] = useState('')

  const opts = AGENT_OPTIONS[agentId] || AGENT_OPTIONS.bash
  const color = AGENT_COLORS[agentId] || '#888'
  const agentName = getAgentName(agentId)
  const isBash = agentId === 'bash'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const args = argsStr.trim() ? argsStr.split(/\s+/).filter(Boolean) : []
    onSubmit({
      agentId,
      workspace: 'default',
      cwd: cwd || '',
      alias: alias.trim() || '',
      autoApprove,
      debug,
      args,
    })
    setCwd(defaultCwd)
    setAlias('')
    setAutoApprove(false)
    setDebug(false)
    setArgsStr('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onClose={onClose} className="bg-[#0d1520] border-[#1e2a3a]" data-testid="create-session-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span style={{ color }}>Launch {agentName}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">Alias</label>
            <Input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder={isBash ? 'e.g. build-server' : `e.g. my-${agentId}-agent`}
              className="h-8 text-xs bg-[#1a2535] border-[#2a3a4a] text-gray-300"
              autoFocus={isBash}
              data-testid="session-alias-input"
            />
            <p className="text-[10px] text-gray-600">Leave empty for auto-generated alias</p>
          </div>

          {!isBash && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">Working Directory</label>
                <FolderPicker
                  value={cwd}
                  onChange={setCwd}
                  placeholder="/path/to/project"
                  inputClassName="h-8 text-xs bg-[#1a2535] border-[#2a3a4a] text-gray-300"
                  data-testid="session-cwd-input"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-medium text-gray-300">{opts.autoApproveLabel}</p>
                  <p className="text-[10px] text-gray-500">{opts.autoApproveDesc}</p>
                </div>
                <Switch checked={autoApprove} onCheckedChange={setAutoApprove} color={color} />
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-medium text-gray-300">Debug Mode</p>
                  <p className="text-[10px] text-gray-500">{opts.debugLabel}</p>
                </div>
                <Switch checked={debug} onCheckedChange={setDebug} color={color} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">Extra Arguments</label>
                <Input
                  value={argsStr}
                  onChange={(e) => setArgsStr(e.target.value)}
                  placeholder="e.g. --model opus"
                  className="h-8 text-xs bg-[#1a2535] border-[#2a3a4a] text-gray-300"
                  data-testid="session-args-input"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}
              data-testid="cancel-session-button"
              className="border-[#2a3a4a] text-gray-400 hover:bg-[#1a2535]">
              Cancel
            </Button>
            <Button type="submit" size="sm"
              data-testid="submit-session-button"
              style={{ backgroundColor: color, color: '#fff' }}>
              Launch
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function getAgentName(id: string): string {
  const names: Record<string, string> = {
    claude: 'Claude Code',
    codex: 'Codex CLI',
    gemini: 'Gemini CLI',
    bash: 'Bash',
  }
  return names[id] || id
}
