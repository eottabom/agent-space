package com.agentspace.presentation.websocket;

import com.agentspace.application.CreateSessionUseCase;
import com.agentspace.application.ManageSessionUseCase;
import com.agentspace.domain.model.SessionInfo;
import com.agentspace.infrastructure.websocket.WebSocketRegistry;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * WebSocket 메시지를 유스케이스 호출로 변환하는 진입점.
 */
@Component
public class AgentWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(AgentWebSocketHandler.class);

    private final CreateSessionUseCase createSessionUseCase;
    private final ManageSessionUseCase manageSessionUseCase;
    private final WebSocketRegistry registry;
    private final ObjectMapper mapper;

    public AgentWebSocketHandler(CreateSessionUseCase createSessionUseCase,
                                 ManageSessionUseCase manageSessionUseCase,
                                 WebSocketRegistry registry,
                                 ObjectMapper mapper) {
        this.createSessionUseCase = createSessionUseCase;
        this.manageSessionUseCase = manageSessionUseCase;
        this.registry = registry;
        this.mapper = mapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        registry.register(session);
        log.info("WS connected: {}", session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        registry.unregister(session);
        log.info("WS disconnected: {} ({})", session.getId(), status);
    }

    @Override
    protected void handleTextMessage(WebSocketSession webSocketSession, TextMessage message)
            throws Exception {
        JsonNode payload = mapper.readTree(message.getPayload());
        String type = payload.path("type").asText("");

        try {
            switch (type) {
                case "session:start" -> onSessionStart(webSocketSession, payload);
                case "session:input" -> onSessionInput(payload);
                case "session:resize" -> onSessionResize(payload);
                case "session:kill" -> onSessionKill(payload);
                case "session:list" -> manageSessionUseCase.sendSessionList(webSocketSession.getId());
                case "session:reconnect" -> onSessionReconnect(webSocketSession, payload);
                case "broadcast:input" -> onBroadcastInput(payload);
                default -> sendError(webSocketSession, "Unknown type: " + type);
            }
        } catch (Exception ex) {
            log.error("Error handling {}: {}", type, ex.getMessage(), ex);
            sendError(webSocketSession, ex.getMessage());
        }
    }

    private void onSessionStart(WebSocketSession webSocketSession, JsonNode payload)
            throws Exception {
        String agentId = payload.path("agentId").asText("claude");
        String workspace = payload.path("workspace").asText("default");
        String cwd = payload.path("cwd").asText("");
        String alias = payload.path("alias").asText("");
        boolean autoApprove = payload.path("autoApprove").asBoolean(false);
        boolean debug = payload.path("debug").asBoolean(false);

        String[] args = null;
        if (payload.has("args") && payload.get("args").isArray()) {
            List<String> argumentList = new ArrayList<>();
            payload.get("args").forEach(argumentNode -> argumentList.add(argumentNode.asText()));
            args = argumentList.toArray(new String[0]);
        }

        var command = new CreateSessionUseCase.Command(
                agentId, workspace, cwd, alias, autoApprove, debug, args);
        SessionInfo session = createSessionUseCase.execute(command);

        // 세션 생성 후 이 클라이언트가 출력을 받을 수 있도록 구독 등록
        registry.subscribe(session.id(), webSocketSession);
    }

    private void onSessionInput(JsonNode payload) throws Exception {
        String sessionId = payload.path("sessionId").asText();
        byte[] data = Base64.getDecoder().decode(payload.path("data").asText());
        manageSessionUseCase.writeInput(sessionId, data);
    }

    private void onSessionResize(JsonNode payload) {
        String sessionId = payload.path("sessionId").asText();
        int cols = payload.path("cols").asInt(120);
        int rows = payload.path("rows").asInt(40);
        manageSessionUseCase.resize(sessionId, cols, rows);
    }

    private void onSessionKill(JsonNode payload) {
        String sessionId = payload.path("sessionId").asText();
        manageSessionUseCase.kill(sessionId);
    }

    private void onSessionReconnect(WebSocketSession webSocketSession, JsonNode payload) {
        String sessionId = payload.path("sessionId").asText();
        registry.subscribe(sessionId, webSocketSession);
        manageSessionUseCase.reconnect(webSocketSession.getId(), sessionId);
    }

    private void onBroadcastInput(JsonNode payload) {
        byte[] data = Base64.getDecoder().decode(payload.path("data").asText());
        List<String> sessionIds = new ArrayList<>();
        payload.path("sessionIds").forEach(sessionNode -> sessionIds.add(sessionNode.asText()));
        manageSessionUseCase.broadcastInput(sessionIds, data);
    }

    private void sendError(WebSocketSession webSocketSession, String message) {
        ObjectNode errorResponse = mapper.createObjectNode();
        errorResponse.put("type", "error");
        errorResponse.put("message", message);
        registry.sendTo(webSocketSession.getId(), errorResponse.toString());
    }
}
