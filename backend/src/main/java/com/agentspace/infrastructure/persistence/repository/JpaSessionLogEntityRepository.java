package com.agentspace.infrastructure.persistence.repository;

import com.agentspace.infrastructure.persistence.entity.SessionLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JpaSessionLogEntityRepository extends JpaRepository<SessionLogEntity, Long> {
    List<SessionLogEntity> findBySessionIdOrderByTimestampAsc(String sessionId);
}
