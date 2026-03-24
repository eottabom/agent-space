/**
 * 에이전트 ID → CLI 커맨드 변환.
 * Java AgentType enum 과 동일한 매핑을 유지한다.
 */
import { existsSync } from 'fs'
import { BASHRC_PATH } from './bashTheme'
import { ZSH_ZDOTDIR } from './zshTheme'

interface AgentDef {
    command: string
    defaultArgs: string[]
    autoApproveFlag: string
    debugFlag: string
    extraEnv?: Record<string, string>
}

/**
 * Bash 에이전트의 기본 인자를 결정한다.
 * 커스텀 bashrc 가 존재하면 --rcfile 로 로드하고,
 * 없으면 기존 -l (로그인 쉘) 폴백.
 */
function bashDefaultArgs(): string[] {
    if (existsSync(BASHRC_PATH)) {
        return ['--rcfile', BASHRC_PATH]
    }
    return ['-l']
}

const AGENT_MAP: Record<string, AgentDef> = {
    claude: {
        command: 'claude',
        defaultArgs: [],
        autoApproveFlag: '--dangerously-skip-permissions',
        debugFlag: '--verbose',
    },
    codex: {
        command: 'codex',
        defaultArgs: [],
        autoApproveFlag: '--full-auto',
        debugFlag: '--debug',
    },
    gemini: {
        command: 'gemini',
        defaultArgs: [],
        autoApproveFlag: '--yolo',
        debugFlag: '--debug',
    },
    bash: {
        command: '/bin/bash',
        defaultArgs: bashDefaultArgs(),
        autoApproveFlag: '',
        debugFlag: '-x',
    },
    zsh: {
        command: '/bin/zsh',
        defaultArgs: [],
        autoApproveFlag: '',
        debugFlag: '-x',
        extraEnv: { ZDOTDIR: ZSH_ZDOTDIR },
    },
}

export interface ResolvedCommand {
    command: string
    args: string[]
    extraEnv?: Record<string, string>
}

export function resolveCommand(
    agentId: string,
    autoApprove: boolean,
    debug: boolean,
    extraArgs: string[],
): ResolvedCommand {
    // 알 수 없는 agentId 는 bash 로 폴백
    const def = AGENT_MAP[agentId.toLowerCase()] ?? AGENT_MAP['bash']
    const args: string[] = [...def.defaultArgs]

    if (autoApprove && def.autoApproveFlag) {
        args.push(def.autoApproveFlag)
    }
    if (debug && def.debugFlag) {
        args.push(def.debugFlag)
    }
    if (extraArgs.length > 0) {
        args.push(...extraArgs)
    }

    return { command: def.command, args, extraEnv: def.extraEnv }
}
