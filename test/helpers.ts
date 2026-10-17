import { calcStats } from '../src/utils/stats'
import { createTestResult } from '../src/utils/results'
import type { Preferences, TestResult } from '../src/utils/storage'

export const preferences: Preferences = {
  mode: 'time',
  duration: 30,
  wordCount: 10,
  settings: { punctuation: false, numbers: false },
}

export function makeResult(
  overrides: Partial<TestResult> = {},
  selectedPreferences: Preferences = preferences,
): TestResult {
  const text = 'test'
  const stats = calcStats(text, text, 60, text.length, text.length)
  const result = createTestResult(
    {
      preferences: selectedPreferences,
      text,
      language: null,
      elapsedSec: 60,
      stats,
      wpmSamples: [1, 2],
      weakKeyStats: {
        t: { attempts: 2, errors: 0 },
        e: { attempts: 1, errors: 0 },
        s: { attempts: 1, errors: 0 },
      },
    },
    { now: () => 1_700_000_000_000, random: () => 0.5 },
  )
  return { ...result, ...overrides } as TestResult
}
