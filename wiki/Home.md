# Agent Space Wiki

Agent Space 는 로컬 CLI 에이전트(Claude Code, Codex CLI, Gemini CLI, Bash)를 PTY로 실행하고, 브라우저와 Electron 앱에서 세션을 관리하는 애플리케이션이다.

## 주요 기능

- PTY 기반 에이전트 세션 생성, 종료, 재연결
- WebSocket 기반 실시간 출력 스트리밍
- 다중 세션 동시 운영 및 브로드캐스트 입력
- 아바타 working/idle 상태 시각화
- Electron 기반 데스크톱 앱 패키징

## 빠른 시작

```bash
cd node-backend
npm run launch
```

브라우저 접속 주소

```text
http://localhost:3000
```

Electron 개발 실행

```bash
cd node-backend
npm run electron:dev
```

## 데모

<video src="https://github.com/eottabom/agent-space/raw/main/videos/agent-space-demo.mp4" autoplay muted loop controls width="100%"></video>
