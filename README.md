# Agent Space

로컬 CLI 에이전트(Claude Code, Codex CLI, Gemini CLI, Bash)를 PTY로 실행하고, 브라우저에서 세션을 관리하는 애플리케이션.

## 주요 기능

- PTY 기반 에이전트 세션 관리 (생성, 종료, 재연결)
- WebSocket 실시간 출력 스트리밍
- 다중 세션 동시 운영 및 브로드캐스트 입력
- 세션 상태 시각화 (도트 아바타, working/idle 상태)

## 기술 스택

- **백엔드**: Java 25, Spring Boot 4, WebSocket, JPA, SQLite, Pty4j
- **프론트엔드**: React 19, TypeScript, Vite, xterm.js, Tailwind CSS

## 사전 요구사항

- Java 25+
- Node.js 20+
- 사용할 CLI 에이전트 설치 (claude, codex, gemini 등)

## 실행 방법

### 로컬 개발

백엔드와 프론트엔드를 각각 실행한다.

```bash
# 백엔드 (8080 포트)
cd backend
./gradlew bootRun

# 프론트엔드 (5173 포트, /ws → 백엔드 프록시)
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속.

## 프로젝트 구조

```
agent-space/
├── backend/          Spring Boot 백엔드
│   └── src/main/java/com/agentspace/
│       ├── application/      유스케이스
│       ├── domain/           모델, 서비스, 리포지토리 인터페이스
│       ├── infrastructure/   JPA, PTY, WebSocket 구현
│       └── presentation/     WebSocket 핸들러
├── frontend/         React 프론트엔드
│   └── src/
│       ├── components/       UI 컴포넌트
│       ├── hooks/            WebSocket, 터미널 훅
│       ├── store/            세션 상태 관리
        └── types/            타입 정의
```
