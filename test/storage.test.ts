import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearHistory,
  derivePersonalBest,
  HISTORY_LIMIT,
  loadAppData,
  resetWeakKeys,
  saveResult,
  STORAGE_SCHEMA_VERSION,
} from '../src/utils/storage'
import type { Preferences } from '../src/utils/storage'
import { makeResult, preferences } from './helpers'

const DATA_KEY = 'typeshyt:state:v2'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('versioned local storage', () => {
  it('round-trips a valid result and preferences', () => {
    const result = makeResult()
    expect(saveResult(result)).toBe(true)
    const loaded = loadAppData()
    expect(loaded.schemaVersion).toBe(STORAGE_SCHEMA_VERSION)
    expect(loaded.history).toEqual([result])
    expect(loaded.weakKeys.t).toEqual({ attempts: 2, errors: 0 })
  })

  it('initializes safe defaults when the key is missing', () => {
    expect(loadAppData()).toMatchObject({
      schemaVersion: STORAGE_SCHEMA_VERSION,
      history: [],
      preferences: { mode: 'time', duration: 30 },
      weakKeys: {},
    })
    expect(localStorage.getItem(DATA_KEY)).not.toBeNull()
  })

  it('recovers from corrupted JSON and drops invalid history entries', () => {
    localStorage.setItem(DATA_KEY, '{not-json')
    expect(loadAppData().history).toEqual([])
    const valid = makeResult()
    localStorage.setItem(DATA_KEY, JSON.stringify({
      schemaVersion: STORAGE_SCHEMA_VERSION,
      preferences,
      history: [valid, { ...valid, wpm: Number.POSITIVE_INFINITY }, { ...valid, mode: 'invalid' }],
      weakKeys: {},
      legacyBests: {},
    }))
    expect(loadAppData().history).toEqual([valid])
  })

  it('archives legacy bests on schema mismatch without treating them as history', () => {
    localStorage.setItem(DATA_KEY, JSON.stringify({ schemaVersion: 1 }))
    localStorage.setItem('typeshyt:best:30', '42')
    const loaded = loadAppData()
    expect(loaded.history).toEqual([])
    expect(loaded.legacyBests).toEqual({ '30': 42 })
  })

  it('retains only the latest history limit', () => {
    const results = Array.from({ length: HISTORY_LIMIT + 1 }, (_, index) => ({
      ...makeResult(),
      id: String(index),
    }))
    localStorage.setItem(DATA_KEY, JSON.stringify({
      schemaVersion: STORAGE_SCHEMA_VERSION,
      preferences,
      history: results,
      weakKeys: {},
      legacyBests: {},
    }))
    const loaded = loadAppData()
    expect(loaded.history).toHaveLength(HISTORY_LIMIT)
    expect(loaded.history[0]?.id).toBe('1')
    expect(loaded.history[loaded.history.length - 1]?.id).toBe(String(HISTORY_LIMIT))
  })

  it('returns safe state instead of throwing when storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
    })
    expect(loadAppData().history).toEqual([])
    expect(saveResult(makeResult())).toBe(false)
  })

  it('clears history independently from aggregate weak-key stats', () => {
    expect(saveResult(makeResult())).toBe(true)
    expect(clearHistory()).toBe(true)
    expect(loadAppData().history).toEqual([])
    expect(loadAppData().weakKeys.t?.attempts).toBe(2)
    expect(resetWeakKeys()).toBe(true)
    expect(loadAppData().weakKeys).toEqual({})
  })
})

describe('history-derived personal best', () => {
  it('matches mode, size or duration, and text settings', () => {
    const wordsPreferences: Preferences = {
      mode: 'words',
      duration: 30,
      wordCount: 10,
      settings: { punctuation: false, numbers: false },
    }
    const matchingWords = makeResult({ wpm: 71 }, wordsPreferences)
    const otherCount = makeResult({ wpm: 91 }, { ...wordsPreferences, wordCount: 25 })
    const punctuationOn = makeResult(
      { wpm: 101 },
      { ...wordsPreferences, settings: { punctuation: true, numbers: false } },
    )
    const timed = makeResult({ wpm: 45, mode: 'time', duration: 30 })
    expect(derivePersonalBest([matchingWords, otherCount, punctuationOn, timed], wordsPreferences)).toBe(71)
    expect(derivePersonalBest([timed], preferences)).toBe(45)
    expect(derivePersonalBest([matchingWords], { ...wordsPreferences, mode: 'code' })).toBe(0)
  })
})
