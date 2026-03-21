# Agent Space

로컬 CLI 에이전트(Claude Code, Codex CLI, Gemini CLI, Bash)를 PTY로 실행하고, 브라우저에서 세션을 관리하는 애플리케이션.

개인이 독립적으로 개발한 프로젝트이며, Anthropic, OpenAI, Google과 공식적인 제휴, 승인 또는 후원 관계가 없습니다. 

![demo](./videos/agent-space-demo.gif)

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

## 사용법

### 세션 생성

상단 툴바에서 에이전트 버튼(`Claude Code`, `Codex CLI`, `Gemini CLI`, `Bash`)을 클릭하면 설정 모달이 열린다.

| 항목 | 설명 |
|------|------|
| **Alias** | 세션 이름 지정 (비워두면 자동 생성) |
| **Working Directory** | 에이전트가 실행될 작업 디렉토리 |
| **Auto Approve** | 에이전트별 자동 승인 모드 (Claude: `--dangerously-skip-permissions`, Codex: `--full-auto`, Gemini: `--yolo`) |
| **Debug Mode** | 디버그 출력 활성화 |
| **Extra Arguments** | 추가 CLI 인자 (e.g. `--model opus`) |

### 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| `Ctrl + 1~9` | 해당 번호의 터미널로 포커스 이동 |

### 터미널 관리

- **Alias 수정**: 터미널 헤더의 세션 이름을 클릭하여 인라인 편집
- **최소화**: `-` 버튼으로 터미널을 하단 독에 최소화, 클릭으로 복원
- **레이아웃 토글**: 세션 2개 이상일 때 상단에 세로 정렬 / 좌우 분할 전환 버튼
- **Kill All**: 실행 중인 모든 세션을 한 번에 종료
- **아바타 영역**: 좌측 토글 버튼으로 접기/펼치기

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
