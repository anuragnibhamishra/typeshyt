import type { TestResult } from '../../utils/storage'

export interface CardModel {
  wpm: number
  rawWpm: number
  accuracy: number
  modeLabel: string
  dateLabel: string
  siteUrl: string
  punctuationEnabled: boolean
  numbersEnabled: boolean
  wpmSamples: number[]
}

export type CardFormat = 'landscape' | 'portrait'

export function buildCardModel(result: TestResult, siteUrl = ''): CardModel {
  let modeLabel: string
  if (result.mode === 'time') {
    modeLabel = `${result.duration}s`
  } else if (result.variant === 'code') {
    modeLabel = `Code · ${result.language}`
  } else if (result.variant === 'weak-keys') {
    modeLabel = `Weak keys · ${result.wordCount} words`
  } else {
    modeLabel = `${result.wordCount} words`
  }

  return {
    wpm: result.wpm,
    rawWpm: result.rawWpm,
    accuracy: result.accuracy,
    modeLabel,
    dateLabel: new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(new Date(result.completedAt)),
    siteUrl,
    punctuationEnabled: result.settings.punctuation,
    numbersEnabled: result.settings.numbers,
    wpmSamples: [...result.wpmSamples],
  }
}

export function buildResultFilename(result: TestResult): string {
  return `typeshyt-${Math.round(result.wpm)}wpm-${result.completedAt.slice(0, 10)}.png`
}

export function buildShareText(result: TestResult, siteUrl: string): string {
  return `I typed ${result.wpm} WPM at ${result.accuracy}% accuracy on TypeShyt\n${siteUrl}`
}
