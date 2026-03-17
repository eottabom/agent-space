package com.agentspace.domain.service;

import com.agentspace.domain.model.SessionInfo;

import java.util.List;

/**
 * 클라이언트에 이벤트를 발행하는 인터페이스.
 */
public interface EventPublisher {

    void publishSessionOutput(String sessionId, byte[] data);

    void publishSessionStarted(SessionInfo session);

    void publishSessionEnded(String sessionId);

    void publishSessionList(String wsSessionId, List<SessionInfo> sessions);

    void publishSessionHistory(String wsSessionId, String sessionId, byte[] history);

    void publishError(String wsSessionId, String message);

}
