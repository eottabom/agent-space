package com.agentspace.infrastructure.websocket;

import com.agentspace.domain.model.SessionInfo;
import com.agentspace.domain.model.SessionState;
import com.agentspace.domain.service.EventPublisher;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.List;

@Component
public class WebSocketEventPublisher implements EventPublisher {

    private static final Logger log = LoggerFactory.getLogger(WebSocketEventPublisher.class);

    private final WebSocketRegistry registry;
    private final ObjectMapper mapper;

    public WebSocketEventPublisher(WebSocketRegistry registry, ObjectMapper mapper) {
        this.registry = registry;
        this.mapper = mapper;
    }

    @Override
    public void publishSessionOutput(String sessionId, byte[] data) {
        ObjectNode message = mapper.createObjectNode();
        message.put("type", "session:output");
        message.put("sessionId", sessionId);
        message.put("data", Base64.getEncoder().encodeToString(data));
        registry.sendToPtySubscribers(sessionId, message.toString());
    }

    @Override
    public void publishSessionStarted(SessionInfo session) {
        ObjectNode message = mapper.createObjectNode();
        message.put("type", "session:started");
        message.put("sessionId", session.id());
        message.put("agentId", session.agentType().name().toLowerCase());
        message.put("workspace", session.workspace());
        message.put("alias", session.alias());
        message.put("cwd", session.cwd());
        registry.sendToAll(message.toString());
    }

    @Override
    public void publishSessionEnded(String sessionId) {
        ObjectNode message = mapper.createObjectNode();
        message.put("type", "session:ended");
        message.put("sessionId", sessionId);
        registry.sendToAll(message.toString());
    }

    @Override
    public void publishSessionList(String wsSessionId, List<SessionInfo> sessions) {
        ObjectNode message = mapper.createObjectNode();
        message.put("type", "session:list:result");

        ArrayNode sessionArray = message.putArray("sessions");
        for (SessionInfo session : sessions) {
            ObjectNode sessionNode = sessionArray.addObject();
            sessionNode.put("id", session.id());
            sessionNode.put("agentId", session.agentType().name().toLowerCase());
            sessionNode.put("workspace", session.workspace());
            sessionNode.put("cwd", session.cwd());
            sessionNode.put("alias", session.alias());
            sessionNode.put("state", session.state().name());
            sessionNode.put("alive", session.state() == SessionState.RUNNING);
        }

        registry.sendTo(wsSessionId, message.toString());
    }

    @Override
    public void publishSessionHistory(String wsSessionId, String sessionId, byte[] history) {
        ObjectNode message = mapper.createObjectNode();
        message.put("type", "session:history");
        message.put("sessionId", sessionId);
        message.put("data", Base64.getEncoder().encodeToString(history));
        registry.sendTo(wsSessionId, message.toString());
    }

    @Override
    public void publishError(String wsSessionId, String message) {
        ObjectNode errorMessage = mapper.createObjectNode();
        errorMessage.put("type", "error");
        errorMessage.put("message", message);
        registry.sendTo(wsSessionId, errorMessage.toString());
    }
}
