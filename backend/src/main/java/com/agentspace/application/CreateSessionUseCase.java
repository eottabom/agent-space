package com.agentspace.application;

import com.agentspace.domain.model.AgentType;
import com.agentspace.domain.model.SessionInfo;
import com.agentspace.domain.model.SessionState;
import com.agentspace.domain.repository.SessionRepository;
import com.agentspace.domain.service.AgentCommandResolver;
import com.agentspace.domain.service.EventPublisher;
import com.agentspace.domain.service.LogService;
import com.agentspace.domain.service.PtyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.UUID;

/**
 * 에이전트 세션 생성 유스케이스.
 */
public class CreateSessionUseCase {

    private static final Logger log = LoggerFactory.getLogger(CreateSessionUseCase.class);

    private final SessionRepository sessionRepository;
    private final PtyService ptyService;
    private final EventPublisher eventPublisher;
    private final LogService logService;
    private final AgentCommandResolver commandResolver;

    public CreateSessionUseCase(SessionRepository sessionRepository,
                                 PtyService ptyService,
                                 EventPublisher eventPublisher,
                                 LogService logService,
                                 AgentCommandResolver commandResolver) {
        this.sessionRepository = sessionRepository;
        this.ptyService = ptyService;
        this.eventPublisher = eventPublisher;
        this.logService = logService;
        this.commandResolver = commandResolver;
    }

    /**
     * 유스케이스 입력 커맨드.
     */
    public record Command(String agentId, String workspace, String cwd,
                          String alias, boolean autoApprove, boolean debug,
                          String[] args) {}

    public SessionInfo execute(Command command) throws IOException {
        String sessionId = UUID.randomUUID().toString();
        AgentType agentType = AgentType.from(command.agentId());
        String cwd = command.cwd().isEmpty() ? System.getProperty("user.home") : command.cwd();

        SessionInfo session = SessionInfo.create(sessionId, agentType, command.workspace(), cwd,
                command.alias(), command.autoApprove(), command.debug(), command.args());
        sessionRepository.save(session);

        String[] resolvedCommand = commandResolver.resolve(
                agentType, command.autoApprove(), command.debug(), command.args());
        ptyService.create(sessionId, resolvedCommand, cwd);

        // 리스너 등록 전에 알림을 보내야 클라이언트가 구독 준비를 마칠 수 있다
        eventPublisher.publishSessionStarted(session);

        ptyService.addOutputListener(sessionId,
                data -> eventPublisher.publishSessionOutput(sessionId, data));
        ptyService.addOutputListener(sessionId,
                data -> logService.enqueue(sessionId, data));

        Thread.ofVirtual().name("pty-monitor-" + sessionId).start(() -> monitorProcess(sessionId));

        log.info("Session created: {} agent={} workspace={}", sessionId, agentType, command.workspace());
        return session;
    }

    private void monitorProcess(String sessionId) {
        while (ptyService.isAlive(sessionId)) {
            try {
                Thread.sleep(2000);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                return;
            }
        }
        sessionRepository.updateState(sessionId, SessionState.STOPPED);
        eventPublisher.publishSessionEnded(sessionId);
    }
}
