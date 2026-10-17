import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTypingTest } from '../src/hooks/useTypingTest'
import type { Preferences, WeakKeyStats } from '../src/utils/storage'

const emptyWeakKeys: WeakKeyStats = {}
const timedConfig: Preferences & { weakKeys: WeakKeyStats } = {
  mode: 'time',
  duration: 2,
  wordCount: 10,
  settings: { punctuation: false, numbers: false },
  weakKeys: emptyWeakKeys,
}

describe('useTypingTest timer and input lifecycle', () => {
  let now: number
  const clock = () => now
  const random = () => 0.5

  beforeEach(() => {
    now = 0
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts exactly one interval on the first typed character, never for empty input', () => {
    const { result } = renderHook(() => useTypingTest(timedConfig, { now: clock, random }))
    act(() => result.current.onType(''))
    expect(result.current.status).toBe('idle')
    expect(vi.getTimerCount()).toBe(0)

    act(() => {
      result.current.onType('t')
      result.current.onType('te')
    })
    expect(result.current.status).toBe('running')
    expect(vi.getTimerCount()).toBe(1)
    expect(result.current.totalKeystrokes).toBe(2)
  })

  it('ticks elapsed time and finishes once at the exact duration', () => {
    const { result } = renderHook(() => useTypingTest({ ...timedConfig, duration: 1 }, { now: clock, random }))
    act(() => result.current.onType('a'))

    now = 999
    act(() => vi.advanceTimersByTime(100))
    expect(result.current.status).toBe('running')
    expect(result.current.elapsed).toBeCloseTo(0.999)

    now = 1_000
    act(() => vi.advanceTimersByTime(100))
    expect(result.current.status).toBe('finished')
    expect(result.current.elapsed).toBe(1)
    expect(result.current.wpmSamples).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(0)

    act(() => result.current.onType('ab'))
    expect(result.current.totalKeystrokes).toBe(1)
    expect(result.current.wpmSamples).toHaveLength(1)
  })

  it('records no more than one sample per second', () => {
    const { result } = renderHook(() => useTypingTest(timedConfig, { now: clock, random }))
    act(() => result.current.onType('a'))

    now = 1_000
    act(() => vi.advanceTimersByTime(1_100))
    expect(result.current.wpmSamples).toHaveLength(1)

    now = 2_000
    act(() => vi.advanceTimersByTime(100))
    expect(result.current.wpmSamples).toHaveLength(2)
  })

  it('cleans the interval and resets text, elapsed time and counters on restart and config changes', () => {
    const { result, rerender } = renderHook(
      (config: Preferences & { weakKeys: WeakKeyStats }) => useTypingTest(config, { now: clock, random }),
      { initialProps: timedConfig },
    )
    act(() => result.current.onType('x'))
    act(() => result.current.restart())
    expect(vi.getTimerCount()).toBe(0)
    expect(result.current).toMatchObject({
      status: 'idle',
      typed: '',
      elapsed: 0,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      wpmSamples: [],
      weakKeyStats: {},
    })

    act(() => result.current.onType('x'))
    expect(vi.getTimerCount()).toBe(1)
    rerender({ ...timedConfig, duration: 60 })
    expect(vi.getTimerCount()).toBe(0)
    expect(result.current.status).toBe('idle')
    expect(result.current.typed).toBe('')
    expect(result.current.elapsed).toBe(0)
    expect(result.current.totalKeystrokes).toBe(0)
  })

  it('does not leave intervals behind during rapid restart', () => {
    const { result } = renderHook(() => useTypingTest(timedConfig, { now: clock, random }))
    for (let index = 0; index < 20; index++) {
      act(() => result.current.onType('x'))
      expect(vi.getTimerCount()).toBe(1)
      act(() => result.current.restart())
      expect(vi.getTimerCount()).toBe(0)
    }
  })

  it('finishes a words test on the final character and records actual elapsed time', () => {
    const wordConfig: Preferences & { weakKeys: WeakKeyStats } = {
      ...timedConfig,
      mode: 'words',
      wordCount: 10,
    }
    const { result } = renderHook(() => useTypingTest(wordConfig, { now: clock, random }))
    const prompt = result.current.text
    act(() => result.current.onType(prompt.charAt(0)))
    now = 750
    act(() => result.current.onType(prompt))
    expect(result.current.status).toBe('finished')
    expect(result.current.elapsed).toBe(0.75)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('counts a corrected mistake as a keystroke but excludes Backspace', () => {
    const wordConfig: Preferences & { weakKeys: WeakKeyStats } = {
      ...timedConfig,
      mode: 'words',
    }
    const { result } = renderHook(() => useTypingTest(wordConfig, { now: clock, random }))
    const expected = result.current.text.charAt(0)
    const wrong = expected === 'x' ? 'y' : 'x'

    act(() => result.current.onType(wrong))
    act(() => result.current.onType(''))
    act(() => result.current.onType(expected))
    expect(result.current.totalKeystrokes).toBe(2)
    expect(result.current.correctKeystrokes).toBe(1)
    expect(result.current.typed).toBe(expected)
    const keyStats = result.current.weakKeyStats[expected]
    expect(keyStats).toBeDefined()
    if (!keyStats) throw new Error('Expected target key statistics')
    expect(keyStats.attempts).toBe(2)
    expect(keyStats.errors).toBe(1)
  })
})
