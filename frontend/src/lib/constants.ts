export const AGENTS = [
  { id: 'claude', label: 'Claude Code', color: '#D97706' },
  { id: 'codex', label: 'Codex CLI', color: '#22C55E' },
  { id: 'gemini', label: 'Gemini CLI', color: '#4285F4' },
  { id: 'shell', label: 'Shell', color: '#A3A3A3' },
] as const

export const AGENT_COLORS: Record<string, string> = {
  claude: '#D97706',
  codex: '#22C55E',
  gemini: '#4285F4',
  shell: '#A3A3A3',
  bash: '#A3A3A3',
  zsh: '#A3A3A3',
}

export const ACTION_ANIMATIONS: Record<string, string> = {
  CODING: 'animate-dot-pulse',
  WATERING: 'animate-dot-bounce',
  CHOPPING: 'animate-dot-shake',
  DIGGING: 'animate-dot-wiggle',
  WALKING: 'animate-dot-bounce',
  THINKING: 'animate-dot-think',
  RESTING: 'animate-dot-float',
}

export const ACTION_LABELS: Record<string, string> = {
  CODING: '코드 작업 중...',
  WATERING: '의존성 설치 중...',
  CHOPPING: '리팩토링 중...',
  DIGGING: '파일 탐색 중...',
  WALKING: '이동 중...',
  THINKING: '분석 중...',
  RESTING: '대기 중',
}
