# Agent Space

로컬 CLI 에이전트(Claude Code, Codex CLI, Gemini CLI, Bash)를 PTY로 실행하고, 브라우저에서 세션을 관리하는 애플리케이션.

개인이 독립적으로 개발한 프로젝트이며, Anthropic, OpenAI, Google과 공식적인 제휴, 승인 또는 후원 관계가 없습니다. 

- [데모 영상](./videos/agent-space-demo.mp4)

## 주요 기능

- PTY 기반 에이전트 세션 관리 (생성, 종료, 재연결)
- WebSocket 실시간 출력 스트리밍
- 다중 세션 동시 운영 및 브로드캐스트 입력
- 세션 상태 시각화 (도트 아바타, working/idle 상태)

## 기술 스택

- **Node.js 백엔드**: Node.js 18+, Express, ws, node-pty, TypeScript
- **Electron**: Electron 33+, electron-builder
- **프론트엔드**: React 19, TypeScript, Vite, xterm.js, Tailwind CSS

## 사전 요구사항

- macOS (Apple Silicon 기준)
- Node.js 18+
- 사용할 CLI 에이전트 설치 (claude, codex, gemini 등)

## 빠른 시작

```bash
cd node-backend
npm run launch
```

`http://localhost:3000` 에서 접속한다.

Electron 앱으로 실행하려면:

```bash
cd node-backend
npm run electron:dev
```

GitHub Releases 에서 받은 macOS 앱이 Apple 인증서명 경고로 실행되지 않으면 quarantine 속성을 제거한 뒤 실행한다.

```bash
xattr -dr com.apple.quarantine /Applications/AgentSpace.app
```

## 프로젝트 구조

```
agent-space/
├── node-backend/           Node.js 백엔드 + Electron
│   ├── scripts/
│   └── src/
│       ├── index.ts          서버 진입점 (Express + WebSocket + PTY)
│       ├── electron.ts       Electron main process
│       ├── types.ts          WebSocket 메시지 타입
│       ├── agentResolver.ts  에이전트 → CLI 커맨드 변환
│       └── sessionRegistry.ts  인메모리 세션 관리
├── backend/                Java/Spring Boot 백엔드 (레거시)
├── frontend/               React 프론트엔드
└── version.properties      릴리스 버전 source of truth
```

## 라이선스

MIT
