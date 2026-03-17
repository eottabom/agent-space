package com.agentspace.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "session_logs", indexes = {
    @Index(name = "idx_session_logs_sid", columnList = "sessionId")
})
public class SessionLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 36)
    private String sessionId;

    @Lob
    @Column(columnDefinition = "BLOB")
    private byte[] content;

    @Column(nullable = false)
    private Instant timestamp;

    public SessionLogEntity() {}

    public SessionLogEntity(String sessionId, byte[] content) {
        this.sessionId = sessionId;
        this.content = content;
        this.timestamp = Instant.now();
    }

    public Long getId() { return id; }
    public String getSessionId() { return sessionId; }
    public byte[] getContent() { return content; }
    public Instant getTimestamp() { return timestamp; }
}
