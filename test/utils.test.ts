import { describe, expect, it } from 'vitest'
import { shouldFinishTextTest, shouldFinishTimedTest } from '../src/utils/completion'
import type { TestResult } from '../src/utils/storage'
import {
  averageWpm,
  calcStats,
  getImprovementLabel,
  getProgressTrend,
  peakWpm,
} from '../src/utils/stats'
import { MIN_WEAK_KEY_ATTEMPTS, getKeyErrorRate, getKeyImprovement, getWeakestKeys } from '../src/utils/weakKeys'
import { createTestResult } from '../src/utils/results'
import { calcStats as calculateStats } from '../src/utils/stats'
import type { Preferences } from '../src/utils/storage'
import { countWords, generateCodeSnippet, generateText, generateWeakPracticeText } from '../src/utils/words'
import { makeResult } from './helpers'

function seededRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0
    return value / 0x1_0000_0000
  }
}

describe('typing metrics', () => {
  it('calculates raw/net WPM and keystroke/character accuracy independently', () => {
    expect(calcStats('hello', 'hxllo', 60, 6, 5)).toMatchObject({
      rawWpm: 1,
      netWpm: 1,
      keystrokeAccuracy: 83.3,
      characterAccuracy: 80,
      correctCharacters: 4,
      incorrectCharacters: 1,
      typedCharacters: 5,
    })
  })

  it('returns finite zeros for empty input and zero elapsed time', () => {
    const stats = calcStats('', '', 0, 0, 0)
    expect(stats).toMatchObject({
      rawWpm: 0,
      netWpm: 0,
      keystrokeAccuracy: 0,
      characterAccuracy: 0,
      correctCharacters: 0,
      incorrectCharacters: 0,
    })
    expect(Object.values(stats).every(Number.isFinite)).toBe(true)
  })

  it('handles all-wrong and all-correct input', () => {
    expect(calcStats('abc', 'xyz', 60, 3, 0)).toMatchObject({
      netWpm: 0,
      keystrokeAccuracy: 0,
      characterAccuracy: 0,
      incorrectCharacters: 3,
    })
    expect(calcStats('abc', 'abc', 30, 3, 3)).toMatchObject({
      netWpm: 1,
      rawWpm: 1,
      keystrokeAccuracy: 100,
      characterAccuracy: 100,
    })
  })

  it('summarizes per-second samples and directional trends', () => {
    expect(averageWpm([])).toBe(0)
    expect(averageWpm([10, 11, 15])).toBe(12)
    expect(peakWpm([])).toBe(0)
    expect(peakWpm([10, 11, 15])).toBe(15)
    expect(getProgressTrend([1, 2, 3])).toBe('steady')
    expect(getProgressTrend([...Array(5).fill(10), ...Array(5).fill(11)])).toBe('improving')
    expect(getProgressTrend([...Array(5).fill(10), ...Array(5).fill(9)])).toBe('declining')
    expect(getProgressTrend([...Array(10).fill(0)])).toBe('steady')
    expect(getProgressTrend([...Array(5).fill(0), ...Array(5).fill(1)])).toBe('improving')
    expect(getImprovementLabel(0.1, 0.2)).toBe('improving')
    expect(getImprovementLabel(0.2, 0.1)).toBe('declining')
    expect(getImprovementLabel(0, 0)).toBe('steady')
    expect(getImprovementLabel(0.1, 0)).toBe('declining')
  })
})

describe('text generation', () => {
  it('generates the requested word count without immediate repeats', () => {
    const words = generateText({
      count: 25,
      settings: { punctuation: false, numbers: false },
      random: seededRandom(42),
    }).split(' ')
    expect(words).toHaveLength(25)
    expect(words.every((word, index) => index === 0 || word !== words[index - 1])).toBe(true)
    expect(countWords(words.join(' '))).toBe(25)
  })

  it('adds punctuation and numbers only when enabled', () => {
    const plain = generateText({
      count: 200,
      settings: { punctuation: false, numbers: false },
      random: seededRandom(5),
    })
    const decorated = generateText({
      count: 400,
      settings: { punctuation: true, numbers: true },
      random: seededRandom(5),
    })
    expect(plain).not.toMatch(/[,.?'0-9]/)
    expect(decorated).toMatch(/[,.?']/)
    expect(decorated).toMatch(/\d/)
  })

  it('creates deterministic multiline code snippets', () => {
    const snippet = generateCodeSnippet(() => 0.75)
    expect(snippet.language).toBe('TypeScript')
    expect(snippet.text).toContain('\n')
    expect(snippet.text).toContain('{')
    expect(countWords(snippet.text)).toBeGreaterThan(0)
  })

  it('weights weak-key practice toward eligible target characters and reports fallback', () => {
    const weakKeys = { s: { attempts: MIN_WEAK_KEY_ATTEMPTS, errors: 20 } }
    const normal = generateText({
      count: 15,
      settings: { punctuation: false, numbers: false },
      random: seededRandom(8),
    })
    const practice = generateWeakPracticeText(
      15,
      { punctuation: false, numbers: false },
      weakKeys,
      seededRandom(8),
    )
    expect(practice.usedWeakKeyFallback).toBe(false)
    expect(practice.text.split(' ').every((word) => word.includes('s'))).toBe(true)
    expect(practice.text.split(' ').filter((word) => word.includes('s')).length)
      .toBeGreaterThan(normal.split(' ').filter((word) => word.includes('s')).length)
    expect(generateWeakPracticeText(10, { punctuation: false, numbers: false }, {}, seededRandom(3)).usedWeakKeyFallback)
      .toBe(true)
    expect(generateText({
      count: Number.NaN,
      settings: { punctuation: false, numbers: false },
      random: seededRandom(1),
    }).split(' ')).toHaveLength(1)
  })
})

describe('weak-key and completion calculations', () => {
  it('ranks only keys above the attempt threshold by error rate', () => {
    expect(getKeyErrorRate(0, 0)).toBe(0)
    expect(getWeakestKeys({
      a: { attempts: MIN_WEAK_KEY_ATTEMPTS - 1, errors: 10 },
      b: { attempts: MIN_WEAK_KEY_ATTEMPTS, errors: 4 },
      c: { attempts: MIN_WEAK_KEY_ATTEMPTS, errors: 10 },
    }).map(([key]) => key)).toEqual(['c', 'b'])
  })

  it('requires sufficient history and attempts before showing improvement', () => {
    const history = Array.from({ length: 10 }, (_, index) => makeResult({
      id: String(index),
      weakKeyStats: { a: { attempts: 5, errors: index < 5 ? 2 : 1 } },
    })) as TestResult[]
    expect(getKeyImprovement(history.slice(0, 5), 'a')).toBeNull()
    expect(getKeyImprovement(history, 'a')).toBe('improving')
    expect(getKeyImprovement(history.map((result) => ({
      ...result,
      weakKeyStats: { a: { attempts: 1, errors: 0 } },
    })), 'a')).toBeNull()
  })

  it('keeps timed and text completion rules separate', () => {
    expect(shouldFinishTimedTest(15, 15)).toBe(true)
    expect(shouldFinishTimedTest(14.9, 15)).toBe(false)
    expect(shouldFinishTextTest(10, 10)).toBe(true)
    expect(shouldFinishTextTest(9, 10)).toBe(false)
  })

  describe('result construction', () => {
    const base = {
      text: 'const n = 1',
      language: null,
      elapsedSec: 1.25,
      stats: calculateStats('const n = 1', 'const n = 1', 1.25, 11, 11),
      wpmSamples: [10, 12],
      weakKeyStats: {},
    }
    const prefs: Preferences = {
      mode: 'words',
      duration: 30,
      wordCount: 10,
      customText: '',
      settings: { punctuation: true, numbers: true },
    }

    it('creates deterministic words, weak-key, and code result variants', () => {
      const now = () => 1_700_000_000_000
      const random = () => 0.5
      const common = { now, random }
      expect(createTestResult({ ...base, preferences: prefs }, common)).toMatchObject({
        mode: 'words',
        wordCount: 10,
        id: expect.stringContaining('1700000000000'),
        completedAt: '2023-11-14T22:13:20.000Z',
      })
      expect(createTestResult({
        ...base,
        preferences: { ...prefs, mode: 'weak-keys' },
      }, common)).toMatchObject({ mode: 'words', variant: 'weak-keys', wordCount: 10 })
      expect(createTestResult({
        ...base,
        language: null,
        preferences: { ...prefs, mode: 'code' },
      }, common)).toMatchObject({ mode: 'words', variant: 'code', language: 'code', wordCount: 4 })
      expect(createTestResult({
        ...base,
        language: 'TypeScript',
        preferences: { ...prefs, mode: 'code' },
      }, common)).toMatchObject({ variant: 'code', language: 'TypeScript' })
    })

    it('copies mutable samples, settings, and aggregates into the result', () => {
      const input = {
        ...base,
        preferences: prefs,
        weakKeyStats: { a: { attempts: 1, errors: 1 } },
      }
      const result = createTestResult(input, { now: () => 0, random: () => 0.25 })
      input.wpmSamples.push(20)
      input.preferences.settings.punctuation = false
      input.weakKeyStats.a.errors = 0
      expect(result.wpmSamples).toEqual([10, 12])
      expect(result.settings.punctuation).toBe(true)
      const keyStats = result.weakKeyStats.a
      expect(keyStats).toBeDefined()
      if (!keyStats) throw new Error('Expected copied weak-key statistics')
      expect(keyStats.errors).toBe(1)
    })
  })
})
