package com.agentspace.infrastructure.persistence;

import com.agentspace.domain.service.LogService;
import com.agentspace.infrastructure.persistence.entity.SessionLogEntity;
import com.agentspace.infrastructure.persistence.repository.JpaSessionLogEntityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;

@Component
public class LogBatchAdapter implements LogService {

    private static final Logger log = LoggerFactory.getLogger(LogBatchAdapter.class);
    private static final int MAX_BATCH = 100;

    private final JpaSessionLogEntityRepository logRepository;
    private final ConcurrentLinkedQueue<SessionLogEntity> queue = new ConcurrentLinkedQueue<>();

    public LogBatchAdapter(JpaSessionLogEntityRepository logRepository) {
        this.logRepository = logRepository;
    }

    @Override
    public void enqueue(String sessionId, byte[] data) {
        queue.offer(new SessionLogEntity(sessionId, data));
    }

    @Scheduled(fixedRate = 2000)
    public void flush() {
        if (queue.isEmpty()) {
            return;
        }

        List<SessionLogEntity> batch = new ArrayList<>(MAX_BATCH);
        SessionLogEntity logEntry;
        while (batch.size() < MAX_BATCH && (logEntry = queue.poll()) != null) {
            batch.add(logEntry);
        }

        if (!batch.isEmpty()) {
            try {
                logRepository.saveAll(batch);
            } catch (Exception ex) {
                log.error("Log batch flush failed: {}", ex.getMessage());
            }
        }
    }
}
