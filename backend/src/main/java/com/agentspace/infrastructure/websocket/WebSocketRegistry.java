package com.agentspace.infrastructure.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class WebSocketRegistry {

    private static final Logger log = LoggerFactory.getLogger(WebSocketRegistry.class);

    private final ConcurrentHashMap<String, WebSocketSession> wsSessions = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Set<String>> ptyToWs = new ConcurrentHashMap<>();

    public void register(WebSocketSession session) {
        wsSessions.put(session.getId(), session);
    }

    public void unregister(WebSocketSession session) {
        wsSessions.remove(session.getId());
        ptyToWs.values().forEach(sessionIds -> sessionIds.remove(session.getId()));
    }

    public void subscribe(String ptySessionId, WebSocketSession wsSession) {
        ptyToWs.computeIfAbsent(ptySessionId, ignoredSessionId -> new CopyOnWriteArraySet<>())
                .add(wsSession.getId());
    }

    public void sendToPtySubscribers(String ptySessionId, String json) {
        Set<String> webSocketSessionIds = ptyToWs.get(ptySessionId);
        if (webSocketSessionIds == null) {
            return;
        }

        TextMessage message = new TextMessage(json);
        for (String webSocketSessionId : webSocketSessionIds) {
            WebSocketSession webSocketSession = wsSessions.get(webSocketSessionId);
            if (webSocketSession != null && webSocketSession.isOpen()) {
                sendSafe(webSocketSession, message);
            }
        }
    }

    public void sendToAll(String json) {
        TextMessage message = new TextMessage(json);
        for (WebSocketSession webSocketSession : wsSessions.values()) {
            if (webSocketSession.isOpen()) {
                sendSafe(webSocketSession, message);
            }
        }
    }

    public void sendTo(String wsSessionId, String json) {
        WebSocketSession webSocketSession = wsSessions.get(wsSessionId);
        if (webSocketSession != null && webSocketSession.isOpen()) {
            sendSafe(webSocketSession, new TextMessage(json));
        }
    }

    private void sendSafe(WebSocketSession session, TextMessage message) {
        synchronized (session) {
            try {
                session.sendMessage(message);
            } catch (IOException ex) {
                log.warn("Send failed to WS {}: {}", session.getId(), ex.getMessage());
            }
        }
    }
}
