import type { Stats } from './stats'
import type { Preferences, TestResult, WeakKeyStats } from './storage'
import { countWords } from './words'

export interface ResultInput {
  preferences: Preferences
  text: string
  language: string | null
  elapsedSec: number
  stats: Stats
  wpmSamples: number[]
  weakKeyStats: WeakKeyStats
}

export interface ResultDependencies {
  now?: () => number
  random?: () => number
}

export function createTestResult(input: ResultInput, dependencies: ResultDependencies = {}): TestResult {
  const now = dependencies.now ?? Date.now
  const random = dependencies.random ?? Math.random
  const timestamp = now()
  const { preferences, text, language, elapsedSec, stats, wpmSamples, weakKeyStats } = input
  const common = {
    id: `${timestamp}-${random().toString(36).slice(2)}`,
    completedAt: new Date(timestamp).toISOString(),
    wpm: stats.netWpm,
    rawWpm: stats.rawWpm,
    accuracy: stats.keystrokeAccuracy,
    correctChars: stats.correctCharacters,
    incorrectChars: stats.incorrectCharacters,
    elapsedSec,
    correctKeystrokes: stats.correctKeystrokes,
    totalKeystrokes: stats.totalKeystrokes,
    settings: { ...preferences.settings },
    wpmSamples: [...wpmSamples],
    weakKeyStats: Object.fromEntries(
      Object.entries(weakKeyStats).map(([key, counter]) => [key, { ...counter }]),
    ),
  }

  if (preferences.mode === 'time') {
    return { ...common, mode: 'time', duration: preferences.duration }
  }
  if (preferences.mode === 'code') {
    return {
      ...common,
      mode: 'words',
      variant: 'code',
      language: language ?? 'code',
      wordCount: countWords(text),
    }
  }
  if (preferences.mode === 'weak-keys') {
    return { ...common, mode: 'words', variant: 'weak-keys', wordCount: preferences.wordCount }
  }
  return { ...common, mode: 'words', wordCount: preferences.wordCount }
}
