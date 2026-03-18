# Agent Space

로컬 CLI 에이전트(Claude Code, Codex CLI, Gemini CLI, Bash)를 PTY로 실행하고, 브라우저에서 세션을 관리하는 애플리케이션.

## 주요 기능

- PTY 기반 에이전트 세션 관리 (생성, 종료, 재연결)
- WebSocket 실시간 출력 스트리밍
- 다중 세션 동시 운영 및 브로드캐스트 입력
- 세션 상태 시각화 (도트 아바타, working/idle 상태)

## 기술 스택

- **Node.js 백엔드** (권장): Node.js 18+, Express, ws, node-pty, TypeScript
- **Electron** (데스크톱 앱): Electron 33+, electron-builder
- **Java 백엔드** (레거시): Java 25, Spring Boot 4, WebSocket, JPA, SQLite, Pty4j
- **프론트엔드**: React 19, TypeScript, Vite, xterm.js, Tailwind CSS

## 사전 요구사항

- macOS (Apple Silicon 기준)
- Node.js 18+
- 사용할 CLI 에이전트 설치 (claude, codex, gemini 등)

## 실행 방법

### 브라우저로 접속 (기본)

처음 실행할 때는 의존성 설치와 프론트엔드 빌드를 포함한 초기 설정을 한 번에 실행한다.

```bash
cd node-backend
npm run launch
```

이후 실행부터는 빌드 없이 바로 시작한다.

```bash
cd node-backend
npm start
```

`http://localhost:3000` 에서 접속한다.

포트를 바꾸려면 환경 변수로 지정한다.

```bash
PORT=8080 npm start
```

### 프론트엔드 핫 리로드 개발

프론트엔드를 수정하면서 개발할 때는 서버와 Vite 개발 서버를 각각 띄운다.

```bash
# 터미널 1 — Node.js 서버 (8080 포트)
cd node-backend
PORT=8080 npm start

# 터미널 2 — Vite 개발 서버 (5173 포트, /ws → 8080 프록시)
cd frontend
npm install
npm run dev
```

`http://localhost:5173` 에서 접속한다. 프론트엔드 변경 사항이 즉시 반영된다.

### Electron 앱으로 실행

브라우저 없이 독립 앱으로 실행한다. 내부적으로 Node.js 서버를 띄우고 Electron 창에서 자동으로 로드한다.

```bash
cd node-backend
npm run electron:dev
```

### Electron 배포 패키징

macOS 기준으로 `.app`과 `.dmg`를 생성한다.

```bash
cd node-backend
npm run electron:build
```

빌드 결과물은 `node-backend/electron-dist/` 에 생성된다.

```
electron-dist/
├── AgentSpace.app                  ← 바로 실행 가능한 앱
├── AgentSpace-1.0.0-arm64.dmg     ← 배포용 설치 파일
└── mac-arm64/
    └── AgentSpace.app
```

실행은 Finder에서 `AgentSpace.app`을 더블클릭하거나 터미널에서 열 수 있다.

```bash
open electron-dist/AgentSpace.app
```

배포할 때는 `.dmg` 파일을 전달한다.

### 플랫폼별 빌드 참고

electron-builder는 **실행 중인 OS에 맞는 패키지만** 생성한다. 각 플랫폼 결과물을 얻으려면 해당 OS에서 `npm run electron:build`를 실행해야 한다.

| OS | 결과물 |
|----|--------|
| macOS | `.app`, `.dmg` |
| Linux | `.AppImage` |
| Windows | `.exe` (NSIS 설치 파일) |

## 수정이 필요한 파일

### 에이전트 CLI 커맨드 변경

`node-backend/src/agentResolver.ts` 에서 각 에이전트의 커맨드와 플래그를 수정한다.

```typescript
const AGENT_MAP = {
    claude: {
        command: 'claude',
        autoApproveFlag: '--dangerously-skip-permissions',
        debugFlag: '--verbose',
    },
    // 에이전트 추가 시 여기에 항목을 추가한다
}
```

### 포트 기본값 변경

`node-backend/src/index.ts` 상단의 `DEFAULT_PORT`를 수정한다.

```typescript
const DEFAULT_PORT = parseInt(process.env.PORT ?? '3000', 10)
```

### Electron 창 크기 변경

`node-backend/src/electron.ts` 상단의 상수를 수정한다.

```typescript
const WINDOW_WIDTH = 1440
const WINDOW_HEIGHT = 900
```

### 앱 이름 / 번들 ID 변경

`node-backend/package.json` 의 `build` 섹션을 수정한다.

```json
"build": {
    "appId": "com.agentspace.app",
    "productName": "AgentSpace"
}
```

## 프로젝트 구조

```
agent-space/
├── node-backend/           Node.js 백엔드 + Electron (권장)
│   ├── scripts/
│   │   └── fix-pty-permissions.js  node-pty 권한 자동 복원 (postinstall)
│   └── src/
│       ├── index.ts          서버 진입점 (Express + WebSocket + PTY)
│       ├── electron.ts       Electron main process
│       ├── types.ts          WebSocket 메시지 타입
│       ├── agentResolver.ts  에이전트 → CLI 커맨드 변환
│       └── sessionRegistry.ts  인메모리 세션 관리
├── backend/                Java/Spring Boot 백엔드 (레거시)
│   └── src/main/java/com/agentspace/
│       ├── application/      유스케이스
│       ├── domain/           모델, 서비스, 리포지토리 인터페이스
│       ├── infrastructure/   JPA, PTY, WebSocket 구현
│       └── presentation/     WebSocket 핸들러
└── frontend/               React 프론트엔드
    └── src/
        ├── components/       UI 컴포넌트
        ├── hooks/            WebSocket, 터미널 훅
        ├── store/            세션 상태 관리
        └── types/            타입 정의
```
