package com.agentspace.domain.repository;

import com.agentspace.domain.model.SessionInfo;
import com.agentspace.domain.model.SessionState;

import java.util.List;
import java.util.Optional;

/**
 * 세션 영속화 인터페이스
 */
public interface SessionRepository {

    void save(SessionInfo session);

    Optional<SessionInfo> findById(String id);

    List<SessionInfo> findAll();

    List<SessionInfo> findByWorkspace(String workspace);

    void updateState(String id, SessionState state);

}
