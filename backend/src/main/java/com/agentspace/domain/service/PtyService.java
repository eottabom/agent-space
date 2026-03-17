package com.agentspace.domain.service;

import java.io.IOException;
import java.util.function.Consumer;

/**
 * PTY 프로세스 관리 인터페이스
 */
public interface PtyService {

    void create(String sessionId, String[] command, String cwd) throws IOException;

    void write(String sessionId, byte[] data) throws IOException;

    void resize(String sessionId, int cols, int rows);

    void kill(String sessionId);

    boolean isAlive(String sessionId);

    byte[] getHistory(String sessionId);

    void addOutputListener(String sessionId, Consumer<byte[]> listener);

    void removeOutputListener(String sessionId, Consumer<byte[]> listener);

}
