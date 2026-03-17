package com.agentspace.infrastructure.config;

import com.agentspace.application.CreateSessionUseCase;
import com.agentspace.application.ManageSessionUseCase;
import com.agentspace.domain.repository.SessionRepository;
import com.agentspace.domain.service.AgentCommandResolver;
import com.agentspace.domain.service.EventPublisher;
import com.agentspace.domain.service.LogService;
import com.agentspace.domain.service.PtyService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 도메인 서비스와 유스케이스 빈 등록.
 */
@Configuration
public class DomainConfig {

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    @Bean
    public AgentCommandResolver agentCommandResolver() {
        return new AgentCommandResolver();
    }

    @Bean
    public CreateSessionUseCase createSessionUseCase(
            SessionRepository sessionRepository,
            PtyService ptyService,
            EventPublisher eventPublisher,
            LogService logService,
            AgentCommandResolver commandResolver) {
        return new CreateSessionUseCase(sessionRepository, ptyService, eventPublisher,
                logService, commandResolver);
    }

    @Bean
    public ManageSessionUseCase manageSessionUseCase(
            SessionRepository sessionRepository,
            PtyService ptyService,
            EventPublisher eventPublisher) {
        return new ManageSessionUseCase(sessionRepository, ptyService, eventPublisher);
    }
}
