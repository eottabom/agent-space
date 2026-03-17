package com.agentspace.infrastructure.persistence;

import com.agentspace.domain.model.AgentType;
import com.agentspace.domain.model.SessionInfo;
import com.agentspace.domain.model.SessionState;
import com.agentspace.domain.repository.SessionRepository;
import com.agentspace.infrastructure.persistence.entity.SessionEntity;
import com.agentspace.infrastructure.persistence.repository.JpaSessionEntityRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Component
public class SessionRepositoryAdapter implements SessionRepository {

    private final JpaSessionEntityRepository jpaRepository;
    private final ObjectMapper objectMapper;

    public SessionRepositoryAdapter(JpaSessionEntityRepository jpaRepository,
                                     ObjectMapper objectMapper) {
        this.jpaRepository = jpaRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void save(SessionInfo session) {
        SessionEntity entity = toEntity(session);
        jpaRepository.save(entity);
    }

    @Override
    public Optional<SessionInfo> findById(String id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<SessionInfo> findAll() {
        return jpaRepository.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public List<SessionInfo> findByWorkspace(String workspace) {
        return jpaRepository.findByWorkspace(workspace).stream().map(this::toDomain).toList();
    }

    @Override
    public void updateState(String id, SessionState state) {
        jpaRepository.updateState(id, state.name(), Instant.now());
    }

    private SessionEntity toEntity(SessionInfo session) {
        SessionEntity entity = new SessionEntity();
        entity.setId(session.id());
        entity.setAgentType(session.agentType().name());
        entity.setWorkspace(session.workspace());
        entity.setCwd(session.cwd());
        entity.setAlias(session.alias());
        entity.setState(session.state().name());
        entity.setAutoApprove(session.autoApprove());
        entity.setDebug(session.debug());
        if (session.args() != null) {
            try {
                entity.setArgs(objectMapper.writeValueAsString(session.args()));
            } catch (Exception ex) {
                entity.setArgs("[]");
            }
        }
        entity.setCreatedAt(session.createdAt());
        entity.setUpdatedAt(session.updatedAt());
        return entity;
    }

    private SessionInfo toDomain(SessionEntity entity) {
        String[] args = null;
        if (entity.getArgs() != null) {
            try {
                args = objectMapper.readValue(entity.getArgs(), String[].class);
            } catch (Exception ex) {
                args = new String[0];
            }
        }
        return new SessionInfo(
                entity.getId(),
                AgentType.from(entity.getAgentType()),
                entity.getWorkspace(),
                entity.getCwd(),
                entity.getAlias(),
                SessionState.valueOf(entity.getState()),
                entity.isAutoApprove(),
                entity.isDebug(),
                args,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
