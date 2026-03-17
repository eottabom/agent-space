package com.agentspace.domain.service;

/**
 * 로그 배치 저장 인터페이스
 */
public interface LogService {

    void enqueue(String sessionId, byte[] data);

}
