export interface Stats {
  rawWpm: number
  netWpm: number
  keystrokeAccuracy: number
  characterAccuracy: number
  correctKeystrokes: number
  totalKeystrokes: number
  correctCharacters: number
  incorrectCharacters: number
  typedCharacters: number
}

/**
 * Raw WPM = (characters typed, including later-corrected characters / 5) / elapsed minutes.
 * Net WPM = (correct characters / 5) / elapsed minutes; incorrect characters are excluded as the error penalty.
 * Keystroke accuracy = correct keystrokes / total keystrokes * 100.
 * Character accuracy = correct characters / typed characters * 100.
 * Empty input has 0% accuracy; zero elapsed time produces 0 WPM.
 */
export function calcStats(
  text: string,
  typed: string,
  elapsedSec: number,
  totalKeystrokes: number,
  correctKeystrokes: number,
): Stats {
  let correctCharacters = 0
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === text[i]) correctCharacters++
  }

  const typedCharacters = typed.length
  const incorrectCharacters = typedCharacters - correctCharacters
  const minutes = elapsedSec > 0 ? elapsedSec / 60 : 0
  return {
    rawWpm: minutes ? Math.round((totalKeystrokes / 5) / minutes) : 0,
    netWpm: minutes ? Math.round((correctCharacters / 5) / minutes) : 0,
    keystrokeAccuracy: totalKeystrokes
      ? Math.round((correctKeystrokes / totalKeystrokes) * 1000) / 10
      : 0,
    characterAccuracy: typedCharacters
      ? Math.round((correctCharacters / typedCharacters) * 1000) / 10
      : 0,
    correctKeystrokes,
    totalKeystrokes,
    correctCharacters,
    incorrectCharacters,
    typedCharacters,
  }
}

export function averageWpm(samples: number[]): number {
  if (samples.length === 0) return 0
  return Math.round(samples.reduce((sum, sample) => sum + sample, 0) / samples.length)
}

function meanWpm(samples: number[]): number {
  return samples.length ? samples.reduce((sum, sample) => sum + sample, 0) / samples.length : 0
}

export function peakWpm(samples: number[]): number {
  return samples.length ? Math.max(...samples) : 0
}

export type ProgressTrend = 'improving' | 'steady' | 'declining'

/** Compare the latest five results with the previous five; a 5% change sets the direction. */
export function getProgressTrend(wpms: number[]): ProgressTrend {
  if (wpms.length < 10) return 'steady'
  const previous = meanWpm(wpms.slice(-10, -5))
  const recent = meanWpm(wpms.slice(-5))
  if (previous === 0) return recent > 0 ? 'improving' : 'steady'
  const change = (recent - previous) / previous
  if (change >= 0.05) return 'improving'
  if (change <= -0.05) return 'declining'
  return 'steady'
}

export function getImprovementLabel(recentErrorRate: number, previousErrorRate: number): ProgressTrend {
  if (previousErrorRate === 0) return recentErrorRate === 0 ? 'steady' : 'declining'
  const change = (recentErrorRate - previousErrorRate) / previousErrorRate
  if (change <= -0.05) return 'improving'
  if (change >= 0.05) return 'declining'
  return 'steady'
}
