package com.agentspace.domain.model;

import java.time.Instant;

/**
 * 세션 도메인 모델. 불변 값 객체.
 */
public record SessionInfo(
        String id,
        AgentType agentType,
        String workspace,
        String cwd,
        String alias,
        SessionState state,
        boolean autoApprove,
        boolean debug,
        String[] args,
        Instant createdAt,
        Instant updatedAt
) {
    public static SessionInfo create(String id, AgentType agentType, String workspace,
                                      String cwd, String customAlias, boolean autoApprove,
                                      boolean debug, String[] args) {
        String alias = (customAlias != null && !customAlias.isBlank())
                ? customAlias
                : agentType.name().toLowerCase() + "-" + id.substring(0, 4);
        Instant now = Instant.now();
        return new SessionInfo(id, agentType, workspace, cwd, alias,
                SessionState.RUNNING, autoApprove, debug, args, now, now);
    }

    public SessionInfo withState(SessionState newState) {
        return new SessionInfo(id, agentType, workspace, cwd, alias, newState,
                autoApprove, debug, args, createdAt, Instant.now());
    }
}
