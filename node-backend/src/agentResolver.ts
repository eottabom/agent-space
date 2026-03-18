/**
 * 에이전트 ID → CLI 커맨드 변환.
 * Java AgentType enum 과 동일한 매핑을 유지한다.
 */

interface AgentDef {
    command: string
    defaultArgs: string[]
    autoApproveFlag: string
    debugFlag: string
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
        defaultArgs: ['-l'],
        autoApproveFlag: '',
        debugFlag: '-x',
    },
}

export interface ResolvedCommand {
    command: string
    args: string[]
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

    return { command: def.command, args }
}
