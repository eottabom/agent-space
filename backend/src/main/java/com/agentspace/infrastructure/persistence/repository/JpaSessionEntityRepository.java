package com.agentspace.infrastructure.persistence.repository;

import com.agentspace.infrastructure.persistence.entity.SessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

public interface JpaSessionEntityRepository extends JpaRepository<SessionEntity, String> {
    List<SessionEntity> findByWorkspace(String workspace);

    @Modifying
    @Transactional
    @Query("UPDATE SessionEntity s SET s.state = :state, s.updatedAt = :now WHERE s.id = :id")
    void updateState(@Param("id") String id, @Param("state") String state, @Param("now") Instant now);
}
