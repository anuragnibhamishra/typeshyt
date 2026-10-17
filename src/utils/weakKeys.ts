import { getImprovementLabel, type ProgressTrend } from './stats'
import type { TestResult, WeakKeyStats } from './storage'

export const MIN_WEAK_KEY_ATTEMPTS = 20

export function getKeyErrorRate(attempts: number, errors: number): number {
  return attempts > 0 ? errors / attempts : 0
}

export function getWeakestKeys(stats: WeakKeyStats, limit = 10): Array<[string, { attempts: number; errors: number }]> {
  return Object.entries(stats)
    .filter(([, counter]) => counter.attempts >= MIN_WEAK_KEY_ATTEMPTS && counter.errors > 0)
    .sort((a, b) => getKeyErrorRate(b[1].attempts, b[1].errors) - getKeyErrorRate(a[1].attempts, a[1].errors))
    .slice(0, limit)
}

export function getKeyImprovement(history: TestResult[], key: string): ProgressTrend | null {
  if (history.length < 10) return null
  const prior = history
    .slice(-10, -5)
    .map((result) => result.weakKeyStats[key])
    .filter((counter): counter is NonNullable<typeof counter> => counter !== undefined)
  const recent = history
    .slice(-5)
    .map((result) => result.weakKeyStats[key])
    .filter((counter): counter is NonNullable<typeof counter> => counter !== undefined)
  const priorAttempts = prior.reduce((sum, counter) => sum + counter.attempts, 0)
  const recentAttempts = recent.reduce((sum, counter) => sum + counter.attempts, 0)
  if (priorAttempts < MIN_WEAK_KEY_ATTEMPTS || recentAttempts < MIN_WEAK_KEY_ATTEMPTS) return null
  const priorErrors = prior.reduce((sum, counter) => sum + counter.errors, 0)
  const recentErrors = recent.reduce((sum, counter) => sum + counter.errors, 0)
  return getImprovementLabel(
    getKeyErrorRate(recentAttempts, recentErrors),
    getKeyErrorRate(priorAttempts, priorErrors),
  )
}
