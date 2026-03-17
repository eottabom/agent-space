package com.agentspace.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "sessions")
public class SessionEntity {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String agentType;

    @Column(nullable = false)
    private String workspace;

    @Column(nullable = false)
    private String cwd;

    private String alias;

    @Column(nullable = false)
    private String state;

    private boolean autoApprove;

    @Column(name = "debug_mode")
    private boolean debug;

    @Column(columnDefinition = "TEXT")
    private String args;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    public SessionEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAgentType() { return agentType; }
    public void setAgentType(String agentType) { this.agentType = agentType; }

    public String getWorkspace() { return workspace; }
    public void setWorkspace(String workspace) { this.workspace = workspace; }

    public String getCwd() { return cwd; }
    public void setCwd(String cwd) { this.cwd = cwd; }

    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public boolean isAutoApprove() { return autoApprove; }
    public void setAutoApprove(boolean autoApprove) { this.autoApprove = autoApprove; }

    public boolean isDebug() { return debug; }
    public void setDebug(boolean debug) { this.debug = debug; }

    public String getArgs() { return args; }
    public void setArgs(String args) { this.args = args; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
