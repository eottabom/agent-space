package com.agentspace.application;

import com.agentspace.domain.model.SessionInfo;
import com.agentspace.domain.model.SessionState;
import com.agentspace.domain.repository.SessionRepository;
import com.agentspace.domain.service.EventPublisher;
import com.agentspace.domain.service.PtyService;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * 기존 세션 제어 유스케이스.
 */
public class ManageSessionUseCase {

    private final SessionRepository sessionRepository;
    private final PtyService ptyService;
    private final EventPublisher eventPublisher;

    public ManageSessionUseCase(SessionRepository sessionRepository,
                                 PtyService ptyService,
                                 EventPublisher eventPublisher) {
        this.sessionRepository = sessionRepository;
        this.ptyService = ptyService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * 세션 정보와 실시간 상태를 묶은 조회 결과.
     */
    public record SessionOverview(SessionInfo session, boolean alive) {}

    public void kill(String sessionId) {
        ptyService.kill(sessionId);
        sessionRepository.updateState(sessionId, SessionState.STOPPED);
        eventPublisher.publishSessionEnded(sessionId);
    }

    public void writeInput(String sessionId, byte[] data) throws IOException {
        ptyService.write(sessionId, data);
    }

    public void resize(String sessionId, int cols, int rows) {
        ptyService.resize(sessionId, cols, rows);
    }

    public void broadcastInput(List<String> sessionIds, byte[] data) {
        for (String sessionId : sessionIds) {
            try {
                ptyService.write(sessionId, data);
            } catch (IOException ex) {
                // 일부 세션 실패 시에도 나머지 세션에 입력을 계속 전달한다
            }
        }
    }

    public List<SessionOverview> listAll() {
        List<SessionInfo> sessions = sessionRepository.findAll();
        List<SessionOverview> overviews = new ArrayList<>();
        for (SessionInfo session : sessions) {
            boolean alive = ptyService.isAlive(session.id());
            overviews.add(new SessionOverview(session, alive));
        }
        return overviews;
    }

    public void reconnect(String wsSessionId, String sessionId) {
        byte[] history = ptyService.getHistory(sessionId);
        if (history.length > 0) {
            eventPublisher.publishSessionHistory(wsSessionId, sessionId, history);
        }
    }

    public void sendSessionList(String wsSessionId) {
        List<SessionInfo> sessions = sessionRepository.findAll();

        // 서버 재시작 등으로 PTY가 사라진 세션을 STOPPED로 보정한다
        List<SessionInfo> reconciled = new ArrayList<>();
        for (SessionInfo session : sessions) {
            if (session.state() == SessionState.RUNNING && !ptyService.isAlive(session.id())) {
                sessionRepository.updateState(session.id(), SessionState.STOPPED);
                reconciled.add(session.withState(SessionState.STOPPED));
            } else {
                reconciled.add(session);
            }
        }

        eventPublisher.publishSessionList(wsSessionId, reconciled);
    }
}
