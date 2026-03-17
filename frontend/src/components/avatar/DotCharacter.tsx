import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { AGENT_COLORS, ACTION_ANIMATIONS } from '@/lib/constants'
import type { AvatarState } from '@/types/session'

interface DotCharacterProps {
  avatar: AvatarState
  alias: string
  sessionId: string
  agentId: string
}

type ActionName = 'CODING' | 'WATERING' | 'CHOPPING' | 'DIGGING' | 'WALKING' | 'THINKING' | 'RESTING'

const RANDOM_ACTIONS: ActionName[] = ['CODING', 'WATERING', 'CHOPPING', 'DIGGING', 'THINKING']

const RANDOM_LABELS: Record<string, string[]> = {
  CODING: ['코드 작업 중...', '열심히 개발 중!', '타이핑 중...', '버그 잡는 중...', '구현 중...'],
  WATERING: ['의존성 설치 중...', '패키지 심는 중~', 'npm install...', '빌드 중...'],
  CHOPPING: ['리팩토링 중...', '코드 정리 중!', '정리정돈 중...', '불필요 코드 제거!'],
  DIGGING: ['파일 탐색 중...', '삽질 중...', '어디있지...?', '코드 분석 중...'],
  WALKING: ['이동 중...', '뚜벅뚜벅...', '걷는 중~'],
  THINKING: ['분석 중...', '생각 중...', '음...', '고민 중...', '공부 중...'],
}

const CHARACTER_STYLES = ['claude', 'codex', 'gemini', 'bash', 'cat', 'dog', 'neko'] as const

function getCharacterStyle(sessionId: string): string {
  let hash = 0
  for (let i = 0; i < sessionId.length; i++) {
    hash = ((hash << 5) - hash + sessionId.charCodeAt(i)) | 0
  }
  return CHARACTER_STYLES[Math.abs(hash) % CHARACTER_STYLES.length]
}

export function DotCharacter({ avatar, alias, sessionId, agentId }: DotCharacterProps) {
  const color = AGENT_COLORS[agentId] || '#888'
  const isActive = avatar.state === 'WORKING' || avatar.state === 'THINKING' || avatar.state === 'MOVING'
  const characterStyle = useMemo(() => getCharacterStyle(sessionId), [sessionId])
  const isAnimal = characterStyle === 'cat' || characterStyle === 'dog' || characterStyle === 'neko'

  const [displayAction, setDisplayAction] = useState<ActionName>((avatar.action as ActionName) || 'RESTING')
  const [displayLabel, setDisplayLabel] = useState('')
  const prevActiveRef = useRef(isActive)

  useEffect(() => {
    const action = (avatar.action as ActionName) || 'RESTING'
    setDisplayAction(action)
    if (!isAnimal) {
      const labels = RANDOM_LABELS[action] || []
      setDisplayLabel(labels.length > 0 ? labels[Math.floor(Math.random() * labels.length)] : '')
    }
  }, [avatar.action, isAnimal])

  useEffect(() => {
    if (!isActive) {
      if (prevActiveRef.current) {
        setDisplayAction('RESTING')
        setDisplayLabel('')
      }
      prevActiveRef.current = isActive
      return
    }
    prevActiveRef.current = isActive

    const cycle = () => {
      const idx = Math.floor(Math.random() * RANDOM_ACTIONS.length)
      const action = RANDOM_ACTIONS[idx]
      setDisplayAction(action)
      if (!isAnimal) {
        const labels = RANDOM_LABELS[action] || []
        setDisplayLabel(labels.length > 0 ? labels[Math.floor(Math.random() * labels.length)] : '')
      }
    }

    const delay = 4000 + Math.random() * 4000
    const timer = setInterval(cycle, delay)
    return () => clearInterval(timer)
  }, [isActive, isAnimal])

  const animClass = ACTION_ANIMATIONS[displayAction] || ''

  // 고양이/강아지 고정 말풍선, 대기 시 말풍선 없음
  const bubbleLabel = !isActive
    ? ''
    : characterStyle === 'cat' || characterStyle === 'neko'
      ? '야옹야옹!'
      : characterStyle === 'dog'
        ? '멍멍!'
        : displayLabel

  return (
    <div className="relative flex flex-col items-center gap-0.5">
      {isActive && bubbleLabel && (
        <div className="relative mb-1 animate-bubble-in">
          <div
            className="rounded border px-1.5 py-0.5 whitespace-nowrap"
            style={{
              fontSize: 9,
              fontFamily: "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
              color: '#dde6f0',
              background: '#0e1726',
              borderColor: `${color}40`,
            }}
          >
            {bubbleLabel}
          </div>
          <div
            className="absolute left-1/2 -ml-[3px]"
            style={{
              bottom: -4,
              width: 6,
              height: 6,
              background: '#0e1726',
              borderRight: `1px solid ${color}40`,
              borderBottom: `1px solid ${color}40`,
              transform: 'rotate(45deg)',
            }}
          />
        </div>
      )}

      <div className="relative">
        <div
          className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full bg-black/20 blur-[3px]"
          style={{ width: 36, height: 8 }}
        />
        <div className={cn('relative z-10', isActive ? animClass : 'animate-dot-float')}>
          <MiniMiSprite color={color} action={displayAction} characterStyle={characterStyle} isActive={isActive} />
        </div>
      </div>

      <div className="flex flex-col items-center mt-1">
        <span
          className="max-w-[80px] truncate text-[8px] text-gray-400"
          style={{ fontFamily: "'Apple SD Gothic Neo', sans-serif" }}
        >
          {alias || agentId}
        </span>
      </div>
    </div>
  )
}

/*
 * O=외곽  H=머리/털  h=하이라이트  F=피부  E=눈  e=눈하이라이트  B=볼  m=입
 * C=옷  c=옷밝음  A=팔피부  P=바지  S=신발  T=도구  R=리본/모자장식
 * W=모자챙  N=비니  K=귀안쪽
 */

// 사람 캐릭터 머리 (4줄, 13칸)
const HEADS: Record<string, string[]> = {
  claude: [
    '...OHHHHHRO..',
    '..OHhhhhhHRO.',
    '.OHHHHHHHhHO.',
    '.OHHHHHHHHHO.',
  ],
  codex: [
    '..OWWWWWWWO..',
    '..ORRRRRRRO..',
    '..OHHHHHHHHO.',
    '.OHHHHHHHHHO.',
  ],
  gemini: [
    '....OhO.Oh...',
    '..OHhHhHhHO..',
    '..OHHHHHHHHO.',
    '.OHHHHHHHHHO.',
  ],
  bash: [
    '..ONNNNNNO...',
    '..ONRRRNNO...',
    '..OHHHHHHHHO.',
    '.OHHHHHHHHHO.',
  ],
}

const FACE: string[] = [
  '.OFFFFEFFFFO.',
  '.OFFBEEFBFFO.',
  '..OFFmFFFFO..',
  '...OFFFFFO...',
]

const BODIES: Record<ActionName, string[]> = {
  RESTING: [
    '...OCCCCCO...',
    '..OcCCCCcCO..',
    '..OACCCCCCAO.',
    '..OACCCCCCAO.',
    '...OCCCCCO...',
    '...OPPPPPO...',
    '...OP..PO....',
    '..OPO..OPO...',
    '..OSO..OSO...',
    '.OSSO..OSSO..',
  ],
  CODING: [
    '...OCCCCCO...',
    '..OcCCCCcCO..',
    'TOACCCCCCAO..',
    'TTOCCCCCCAO..',
    '...OCCCCCO...',
    '...OPPPPPO...',
    '...OP..PO....',
    '..OPO..OPO...',
    '..OSO..OSO...',
    '.OSSO..OSSO..',
  ],
  WATERING: [
    '...OCCCCCO...',
    '..OcCCCCcCO..',
    '..OACCCCCCOTT',
    '...OCCCCCcOTT',
    '...OCCCCCO.T.',
    '...OPPPPPO...',
    '...OP..PO....',
    '..OPO..OPO...',
    '..OSO..OSO...',
    '.OSSO..OSSO..',
  ],
  CHOPPING: [
    '...OCCCCCO...',
    '..OcCCCCcCO..',
    '..OACCCCCCAOT',
    '..OACCCCCCATT',
    '...OCCCCCO...',
    '...OPPPPPO...',
    '...OP..PO....',
    '..OPO..OPO...',
    '..OSO..OSO...',
    '.OSSO..OSSO..',
  ],
  DIGGING: [
    '...OCCCCCO...',
    '..OcCCCCcCO..',
    '..OACCCCCCAO.',
    '...OCCCCCcCAT',
    '...OCCCCCO..T',
    '...OPPPPPO.T.',
    '...OP..PO....',
    '..OPO...PO...',
    '..OSO..OSO...',
    '.OSSO..OSSO..',
  ],
  WALKING: [
    '...OCCCCCO...',
    '..OcCCCCcCO..',
    '..OACCCCCCAO.',
    '..OACCCCCCAO.',
    '...OCCCCCO...',
    '...OPPPPPO...',
    '...OP...PO...',
    '..OPO..OPO...',
    '..OSO...OSO..',
    '.OSSO....SSO.',
  ],
  THINKING: [
    '...OCCCCCO...',
    '..OcCCCCcCO..',
    '..OACCCCCCAO.',
    '..AOCCCCCCOA.',
    '...OCCCCCO...',
    '...OPPPPPO...',
    '...OP..PO....',
    '..OPO..OPO...',
    '..OSO..OSO...',
    '.OSSO..OSSO..',
  ],
}

function getChoppingHead(style: string): string[] {
  const base = HEADS[style] || HEADS.bash
  return [
    '..........TT.',
    base[0].slice(0, -1) + '.',
    ...base.slice(1),
  ]
}

function getThinkingHead(style: string): string[] {
  const base = HEADS[style] || HEADS.bash
  return [
    '.........OOO.',
    base[0].slice(0, -2) + 'O.',
    ...base.slice(1),
  ]
}

const CAT_BASE: string[] = [
  '..OH.....HO..',
  '.OKHO...OHKO.',
  '.OHHHhHhHHHO.',
  'OHHhHHHHHhHHO',
  'OHEEeHHHEeEHO',
  'OHEEEHHHEEEHO',
  'OHHFHHmHHFHHO',
  '.OHFBHHHBFHO.',
  '..OHFFFFFHO..',
  '...OHFFFHO...',
  '...OHFFFHO...',
  '...OHFFFHOH..',
  '...OHF.FHOH..',
  '...OOO.OOO...',
]

const CAT_WALK: string[] = [
  '..OH.....HO..',
  '.OKHO...OHKO.',
  '.OHHHhHhHHHO.',
  'OHHhHHHHHhHHO',
  'OHEEeHHHEeEHO',
  'OHEEEHHHEEEHO',
  'OHHFHHmHHFHHO',
  '.OHFBHHHBFHO.',
  '..OHFFFFFHO..',
  '...OHFFFHO...',
  '...OHFFFHO...',
  '...OHFFFHOH..',
  '..OHF...FHOH.',
  '..OOO...OOO..',
]

const DOG_BASE: string[] = [
  '..OHO...OHO..',
  '.OHHO...OHHO.',
  '.OHHHHHHHHHO.',
  'OHHHHHHHHHHHHO',
  'OHEEeHHHeEEHO',
  'OHEEEHHHEEEHO',
  'OHHHHHmHHHHHO',
  'OHBHHHHHHHBHO',
  '.ODDDDDDDDDO.',
  '.OHHHHHHHHHOHO',
  '.OHHHHHHHHHO..',
  '..OHH...HHO..',
  '..OOO...OOO..',
]

const DOG_WALK: string[] = [
  '..OHO...OHO..',
  '.OHHO...OHHO.',
  '.OHHHHHHHHHO.',
  'OHHHHHHHHHHHHO',
  'OHEEeHHHeEEHO',
  'OHEEEHHHEEEHO',
  'OHHHHHmHHHHHO',
  'OHBHHHHHHHBHO',
  '.ODDDDDDDDDO.',
  '.OHHHHHHHHHO.',
  '.OHHHHHHHHHO.',
  '..OHH..HHO...',
  '..OOO..OOO...',
]

const NEKO_BASE: string[] = [
  '...OH...HO...',
  '..OKHO.OHKO..',
  '.OHHHHHHHHHO.',
  'OHHHHHHHHHHHHO',
  'OHhEhHHHhEhHO',
  'OHHHHHmHHHHHO',
  'OHHBHmHmHBHHO',
  'OHHHFFFFFFHHHO',
  'OHHFFFFFFFFHHO',
  'OHHHFFFFFFHHHO',
  '.OHHHHHHHHHOHO',
  '.OHHHO.OHHHO.',
  '..OOO...OOO..',
]

const NEKO_WALK: string[] = [
  '...OH...HO...',
  '..OKHO.OHKO..',
  '.OHHHHHHHHHO.',
  'OHHHHHHHHHHHHO',
  'OHhEhHHHhEhHO',
  'OHHHHHmHHHHHO',
  'OHHBHmHmHBHHO',
  'OHHHFFFFFFHHHO',
  'OHHFFFFFFFFHHO',
  'OHHHFFFFFFHHHO',
  '.OHHHHHHHHHOHO',
  'OHHHO...OHHHO',
  '.OOO.....OOO.',
]

function buildGrid(characterStyle: string, action: ActionName): string[] {
  if (characterStyle === 'cat') {
    return action === 'WALKING' ? CAT_WALK : CAT_BASE
  }
  if (characterStyle === 'dog') {
    return action === 'WALKING' ? DOG_WALK : DOG_BASE
  }
  if (characterStyle === 'neko') {
    return action === 'WALKING' ? NEKO_WALK : NEKO_BASE
  }
  if (action === 'CHOPPING') {
    return [...getChoppingHead(characterStyle), ...FACE, ...BODIES.CHOPPING]
  }
  if (action === 'THINKING') {
    return [...getThinkingHead(characterStyle), ...FACE, ...BODIES.THINKING]
  }
  const head = HEADS[characterStyle] || HEADS.bash
  return [...head, ...FACE, ...(BODIES[action] || BODIES.RESTING)]
}

function MiniMiSprite({
  color,
  action,
  characterStyle,
  isActive,
}: {
  color: string
  action: ActionName
  characterStyle: string
  isActive: boolean
}) {
  const palette = useMemo(() => {
    const lt = lighten(color, 0.3)
    const dk = darken(color, 0.35)
    return {
      'O': '#080e17',
      'H': color,
      'h': lt,
      'F': '#FFDCC8',
      'E': '#1a1020',
      'e': '#FFFFFF',
      'B': '#FFB0A0',
      'm': '#E88878',
      'C': color,
      'c': lt,
      'A': '#FFDCC8',
      'P': dk,
      'S': '#151525',
      'T': '#FFD700',
      'R': lighten(color, 0.5),
      'W': dk,
      'N': darken(color, 0.15),
      'K': lighten(color, 0.15),
      'D': '#FF7F6B',
      '.': 'transparent',
    } as Record<string, string>
  }, [color])

  const grid = useMemo(
    () => buildGrid(characterStyle, action || 'RESTING'),
    [characterStyle, action],
  )
  const cols = grid.reduce((max, row) => Math.max(max, row.length), 0)
  const px = 3

  const pixels = useMemo(() => {
    const out: string[] = []
    for (const row of grid) {
      const padded = row.padEnd(cols, '.')
      for (const ch of padded) {
        out.push(palette[ch] || 'transparent')
      }
    }
    return out
  }, [grid, palette, cols])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${px}px)`,
        gridTemplateRows: `repeat(${grid.length}, ${px}px)`,
        filter: isActive ? `drop-shadow(0 0 6px ${color}44)` : 'drop-shadow(0 2px 2px rgba(0,0,0,0.25))',
        imageRendering: 'pixelated' as const,
      }}
    >
      {pixels.map((bg, i) => (
        <div key={i} style={{ width: px, height: px, backgroundColor: bg }} />
      ))}
    </div>
  )
}

function darken(hex: string, amount: number) {
  const red = parseInt(hex.slice(1, 3), 16)
  const green = parseInt(hex.slice(3, 5), 16)
  const blue = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(red * (1 - amount))},${Math.round(green * (1 - amount))},${Math.round(blue * (1 - amount))})`
}

function lighten(hex: string, amount: number) {
  const red = parseInt(hex.slice(1, 3), 16)
  const green = parseInt(hex.slice(3, 5), 16)
  const blue = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.min(255, Math.round(red + (255 - red) * amount))},${Math.min(255, Math.round(green + (255 - green) * amount))},${Math.min(255, Math.round(blue + (255 - blue) * amount))})`
}
