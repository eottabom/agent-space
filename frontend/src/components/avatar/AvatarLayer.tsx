import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DotCharacter } from './DotCharacter'
import { useSessionStore } from '@/store/sessionStore'
import type { AvatarState } from '@/types/session'

const DEFAULT_AVATAR: Omit<AvatarState, 'sessionId'> = {
  state: 'IDLE',
  action: 'RESTING',
  message: '',
  zone: 'IDLE_ZONE',
}

const CHAR_W = 64
const IDLE_RATIO = 0.3 // idle zone = 왼쪽 30%
const WALK_DURATION = 8 // seconds

export function AvatarLayer() {
  const { store } = useSessionStore()
  const [containerWidth, setContainerWidth] = useState(0)
  const [travelingIds, setTravelingIds] = useState<Set<string>>(new Set())
  const prevZones = useRef<Map<string, string>>(new Map())
  const roRef = useRef<ResizeObserver | null>(null)

  // callback ref — div가 실제로 DOM에 붙을 때마다 width를 측정
  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (roRef.current) {
      roRef.current.disconnect()
      roRef.current = null
    }
    if (!el) return
    setContainerWidth(el.clientWidth)
    const ro = new ResizeObserver(([e]) => setContainerWidth(e.contentRect.width))
    ro.observe(el)
    roRef.current = ro
  }, [])

  const aliveSessions = useMemo(
    () => Array.from(store.sessions.values()).filter((s) => s.alive),
    [store.sessions],
  )

  const sessionAvatars = useMemo(
    () =>
      aliveSessions.map((session) => ({
        session,
        avatar: store.avatars.get(session.id) || { ...DEFAULT_AVATAR, sessionId: session.id },
      })),
    [aliveSessions, store.avatars],
  )

  // Target positions — idle 왼쪽 작게, working 오른쪽 넓게
  const targets = useMemo(() => {
    if (containerWidth === 0) return new Map<string, number>()

    const idleBound = Math.round(containerWidth * IDLE_RATIO)
    const workZoneStart = idleBound + 40
    const workZoneEnd = containerWidth - 16

    const idleIds: string[] = []
    const workIds: string[] = []
    for (const { session, avatar } of sessionAvatars) {
      if (avatar.zone === 'WORKING_ZONE') workIds.push(session.id)
      else idleIds.push(session.id)
    }

    // Center working avatars within the working zone
    const totalWorkW = workIds.length * CHAR_W
    const workZoneCenter = (workZoneStart + workZoneEnd) / 2
    const workGroupStart = Math.max(workZoneStart, Math.round(workZoneCenter - totalWorkW / 2))

    const m = new Map<string, number>()
    idleIds.forEach((id, i) => m.set(id, 16 + i * CHAR_W))
    workIds.forEach((id, i) => m.set(id, workGroupStart + i * CHAR_W))
    return m
  }, [containerWidth, sessionAvatars])

  // Detect zone changes → walking state
  useEffect(() => {
    const newlyTraveling: string[] = []
    for (const { session, avatar } of sessionAvatars) {
      const old = prevZones.current.get(session.id)
      prevZones.current.set(session.id, avatar.zone)
      if (old && old !== avatar.zone) newlyTraveling.push(session.id)
    }
    if (newlyTraveling.length === 0) return

    const addTimer = window.setTimeout(() => {
      setTravelingIds((prev) => {
        const next = new Set(prev)
        newlyTraveling.forEach((id) => next.add(id))
        return next
      })
    }, 0)

    const removeTimer = window.setTimeout(() => {
      setTravelingIds((prev) => {
        const next = new Set(prev)
        newlyTraveling.forEach((id) => next.delete(id))
        return next
      })
    }, WALK_DURATION * 1000 + 200)

    return () => {
      clearTimeout(addTimer)
      clearTimeout(removeTimer)
    }
  }, [sessionAvatars])

  if (aliveSessions.length === 0) return null

  const idleBound = Math.round(containerWidth * IDLE_RATIO)

  return (
    <div
      ref={containerRef}
      className="relative w-full border-b border-[#1a2535] bg-[#0a1220]/80 overflow-hidden"
      style={{ minHeight: 120 }}
      data-testid="avatar-layer"
    >
      <div className="absolute top-2 left-4">
        <span className="text-[7px] uppercase tracking-widest text-gray-600 font-mono">idle</span>
      </div>
      <div className="absolute top-2" style={{ left: idleBound + 48 }}>
        <span className="text-[7px] uppercase tracking-widest text-gray-600 font-mono">working</span>
      </div>

      {/* Zone divider */}
      <div
        className="absolute top-0 bottom-0 border-l border-dashed border-[#1a2535] opacity-40"
        style={{ left: idleBound + 20 }}
      />

      {sessionAvatars.map(({ session, avatar }) => {
        const x = targets.get(session.id) ?? 16
        const isTraveling = travelingIds.has(session.id)

        return (
          <div
            key={session.id}
            className="absolute bottom-2"
            data-testid={`avatar-${session.id}`}
            data-zone={avatar.zone}
            data-state={isTraveling ? 'MOVING' : avatar.state}
            style={{
              left: 0,
              transform: `translateX(${x}px)`,
              transition: `transform ${WALK_DURATION}s steps(30, end)`,
            }}
          >
            <DotCharacter
              avatar={
                isTraveling
                  ? { ...avatar, state: 'MOVING', action: 'WALKING' }
                  : avatar
              }
              alias={session.alias}
              sessionId={session.id}
              agentId={session.agentId}
            />
          </div>
        )
      })}
    </div>
  )
}
