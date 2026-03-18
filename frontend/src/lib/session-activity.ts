import type { Session } from '@/types/session'

export const IDLE_THRESHOLD_MS = 5000
export const ACTIVITY_REFRESH_MS = 1000

export function isSessionWorking(session: Session, now: number = Date.now()): boolean {
    if (!session.alive || session.state !== 'RUNNING') {
        return false
    }

    if (!session.lastOutputAt) {
        return false
    }

    return now - session.lastOutputAt < IDLE_THRESHOLD_MS
}
