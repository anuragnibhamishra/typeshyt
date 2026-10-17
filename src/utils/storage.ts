import type { Mode } from './words'

export const STORAGE_SCHEMA_VERSION = 2
export const HISTORY_LIMIT = 200

export interface TestSettings {
  punctuation: boolean
  numbers: boolean
}

export interface Preferences {
  mode: Mode
  duration: number
  wordCount: 10 | 25 | 50
  settings: TestSettings
}

interface ResultCommon {
  id: string
  completedAt: string
  wpm: number
  rawWpm: number
  accuracy: number
  correctChars: number
  incorrectChars: number
  elapsedSec: number
  correctKeystrokes: number
  totalKeystrokes: number
  settings: TestSettings
  wpmSamples: number[]
  weakKeyStats: WeakKeyStats
}

export type TestResult =
  | (ResultCommon & { mode: 'time'; duration: number })
  | (ResultCommon & { mode: 'words'; variant?: never; wordCount: 10 | 25 | 50 })
  | (ResultCommon & { mode: 'words'; variant: 'weak-keys'; wordCount: 10 | 25 | 50 })
  | (ResultCommon & { mode: 'words'; variant: 'code'; language: string; wordCount: number })

export interface KeyCounter {
  attempts: number
  errors: number
}

export type WeakKeyStats = Record<string, KeyCounter>

export interface AppData {
  schemaVersion: typeof STORAGE_SCHEMA_VERSION
  preferences: Preferences
  history: TestResult[]
  weakKeys: WeakKeyStats
  legacyBests: Record<string, number>
}

export const DEFAULT_PREFERENCES: Preferences = {
  mode: 'time',
  duration: 30,
  wordCount: 25,
  settings: { punctuation: false, numbers: false },
}

const DATA_KEY = 'typeshyt:state:v2'
const OLD_BEST_DURATIONS = [15, 30, 60, 120]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isSettings(value: unknown): value is TestSettings {
  return isRecord(value) && typeof value.punctuation === 'boolean' && typeof value.numbers === 'boolean'
}

function isWeakKeyStats(value: unknown): value is WeakKeyStats {
  return isRecord(value) && Object.entries(value).every(
    ([key, counter]) =>
      key.length === 1 &&
      isRecord(counter) &&
      Number.isInteger(counter.attempts) &&
      Number(counter.attempts) >= 0 &&
      Number.isInteger(counter.errors) &&
      Number(counter.errors) >= 0 &&
      Number(counter.errors) <= Number(counter.attempts),
  )
}

function isResult(value: unknown): value is TestResult {
  if (!isRecord(value)) return false
  const commonValid =
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.completedAt === 'string' &&
    !Number.isNaN(Date.parse(value.completedAt)) &&
    isFiniteNonNegative(value.wpm) &&
    isFiniteNonNegative(value.rawWpm) &&
    isFiniteNonNegative(value.accuracy) &&
    value.accuracy <= 100 &&
    Number.isInteger(value.correctChars) &&
    isFiniteNonNegative(value.correctChars) &&
    Number.isInteger(value.incorrectChars) &&
    isFiniteNonNegative(value.incorrectChars) &&
    isFiniteNonNegative(value.elapsedSec) &&
    Number.isInteger(value.correctKeystrokes) &&
    isFiniteNonNegative(value.correctKeystrokes) &&
    Number.isInteger(value.totalKeystrokes) &&
    isFiniteNonNegative(value.totalKeystrokes) &&
    Number(value.correctKeystrokes) <= Number(value.totalKeystrokes) &&
    isSettings(value.settings) &&
    Array.isArray(value.wpmSamples) &&
    value.wpmSamples.length <= 3600 &&
    value.wpmSamples.every(isFiniteNonNegative) &&
    isWeakKeyStats(value.weakKeyStats)

  if (!commonValid || !isWeakKeyStats(value.weakKeyStats)) return false
  const aggregateKeyCounters = Object.values(value.weakKeyStats)
  const attemptsRecorded = aggregateKeyCounters.reduce((sum, counter) => sum + counter.attempts, 0)
  const errorsRecorded = aggregateKeyCounters.reduce((sum, counter) => sum + counter.errors, 0)
  if (
    attemptsRecorded !== value.totalKeystrokes ||
    errorsRecorded !== Number(value.totalKeystrokes) - Number(value.correctKeystrokes) ||
    Number(value.correctChars) + Number(value.incorrectChars) > Number(value.totalKeystrokes)
  ) {
    return false
  }
  if (value.mode === 'time') {
    return [15, 30, 60, 120].includes(Number(value.duration)) && value.variant === undefined
  }
  if (value.mode !== 'words' || !Number.isInteger(value.wordCount) || Number(value.wordCount) < 1) return false
  if (value.variant === 'code') return typeof value.language === 'string' && value.language.length > 0
  if (value.variant === 'weak-keys' || value.variant === undefined) {
    return value.wordCount === 10 || value.wordCount === 25 || value.wordCount === 50
  }
  return false
}

function validateWeakKeys(value: unknown): WeakKeyStats {
  if (!isRecord(value)) return {}
  const weakKeys: WeakKeyStats = {}
  for (const [key, counter] of Object.entries(value)) {
    if (
      key.length === 1 &&
      isRecord(counter) &&
      Number.isInteger(counter.attempts) &&
      Number(counter.attempts) >= 0 &&
      Number.isInteger(counter.errors) &&
      Number(counter.errors) >= 0 &&
      Number(counter.errors) <= Number(counter.attempts)
    ) {
      weakKeys[key] = { attempts: Number(counter.attempts), errors: Number(counter.errors) }
    }
  }
  return weakKeys
}

function validatePreferences(value: unknown): Preferences {
  if (!isRecord(value)) return DEFAULT_PREFERENCES
  const mode: Mode =
    value.mode === 'words' || value.mode === 'code' || value.mode === 'weak-keys' ? value.mode : 'time'
  const duration = [15, 30, 60, 120].includes(Number(value.duration)) ? Number(value.duration) : 30
  const wordCount = [10, 25, 50].includes(Number(value.wordCount))
    ? (Number(value.wordCount) as Preferences['wordCount'])
    : 25
  const settings = isSettings(value.settings) ? value.settings : DEFAULT_PREFERENCES.settings
  return { mode, duration, wordCount, settings }
}

function emptyData(): AppData {
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    preferences: DEFAULT_PREFERENCES,
    history: [],
    weakKeys: {},
    legacyBests: {},
  }
}

function writeData(data: AppData): boolean {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

function readLegacyBests(): Record<string, number> {
  const legacy: Record<string, number> = {}
  try {
    for (const duration of OLD_BEST_DURATIONS) {
      const raw = localStorage.getItem(`typeshyt:best:${duration}`)
      if (raw === null) continue
      const best = Number(raw)
      if (Number.isFinite(best) && best > 0) legacy[String(duration)] = best
    }
  } catch {
    return legacy
  }
  return legacy
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (raw === null) {
      const initial = emptyData()
      initial.legacyBests = readLegacyBests()
      writeData(initial)
      return initial
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.schemaVersion !== STORAGE_SCHEMA_VERSION) {
      const initial = emptyData()
      initial.legacyBests = readLegacyBests()
      writeData(initial)
      return initial
    }
    const data = emptyData()
    data.preferences = validatePreferences(parsed.preferences)
    data.history = Array.isArray(parsed.history)
      ? parsed.history.filter(isResult).slice(-HISTORY_LIMIT)
      : []
    data.weakKeys = validateWeakKeys(parsed.weakKeys)
    if (isRecord(parsed.legacyBests)) {
      const legacyBests: Record<string, number> = {}
      for (const [duration, score] of Object.entries(parsed.legacyBests)) {
        if (isFiniteNonNegative(score)) legacyBests[duration] = score
      }
      data.legacyBests = legacyBests
    } else {
      data.legacyBests = readLegacyBests()
    }
    writeData(data)
    return data
  } catch {
    const fallback = emptyData()
    fallback.legacyBests = readLegacyBests()
    writeData(fallback)
    return fallback
  }
}

export function savePreferences(preferences: Preferences): boolean {
  const data = loadAppData()
  data.preferences = preferences
  return writeData(data)
}

export function saveResult(result: TestResult): boolean {
  if (!isResult(result)) return false
  const data = loadAppData()
  data.history = [...data.history, result].slice(-HISTORY_LIMIT)
  for (const [key, count] of Object.entries(result.weakKeyStats)) {
    const current = data.weakKeys[key] ?? { attempts: 0, errors: 0 }
    data.weakKeys[key] = {
      attempts: current.attempts + count.attempts,
      errors: current.errors + count.errors,
    }
  }
  return writeData(data)
}

export function saveWeakKeys(weakKeys: WeakKeyStats): boolean {
  const data = loadAppData()
  data.weakKeys = validateWeakKeys(weakKeys)
  return writeData(data)
}

export function clearHistory(): boolean {
  const data = loadAppData()
  data.history = []
  return writeData(data)
}

export function resetWeakKeys(): boolean {
  return saveWeakKeys({})
}

export function derivePersonalBest(history: TestResult[], preferences: Preferences): number {
  return history
    .filter((result) => {
      if (
        result.settings.punctuation !== preferences.settings.punctuation ||
        result.settings.numbers !== preferences.settings.numbers
      ) {
        return false
      }
      if (preferences.mode === 'time') {
        return result.mode === 'time' && result.duration === preferences.duration
      }
      if (preferences.mode === 'code') return result.mode === 'words' && result.variant === 'code'
      if (preferences.mode === 'weak-keys') {
        return result.mode === 'words' && result.variant === 'weak-keys' && result.wordCount === preferences.wordCount
      }
      return result.mode === 'words' && result.variant === undefined && result.wordCount === preferences.wordCount
    })
    .reduce((best, result) => Math.max(best, result.wpm), 0)
}
