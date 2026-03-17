package com.agentspace.domain.service;

import com.agentspace.domain.model.AgentType;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 에이전트 타입별 CLI 실행 명령 결정 서비스.
 */
public class AgentCommandResolver {

    public String[] resolve(AgentType agentType, boolean autoApprove, boolean debug,
                            String[] extraArgs) {
        List<String> commandParts = new ArrayList<>();
        commandParts.add(agentType.command());
        commandParts.addAll(Arrays.asList(agentType.defaultArgs()));

        if (autoApprove && !agentType.autoApproveFlag().isEmpty()) {
            commandParts.add(agentType.autoApproveFlag());
        }
        if (debug) {
            commandParts.add(agentType.debugFlag());
        }
        if (extraArgs != null && extraArgs.length > 0) {
            commandParts.addAll(Arrays.asList(extraArgs));
        }

        return commandParts.toArray(new String[0]);
    }
}
