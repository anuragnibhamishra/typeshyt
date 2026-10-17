import { useCallback, useEffect, useRef, useState } from 'react'
import { shouldFinishTextTest, shouldFinishTimedTest } from '../utils/completion'
import { calcStats } from '../utils/stats'
import {
  generateCodeSnippet,
  generateText,
  generateWeakPracticeText,
} from '../utils/words'
import type { Preferences, WeakKeyStats } from '../utils/storage'

export type Status = 'idle' | 'running' | 'finished'

interface Config extends Preferences {
  weakKeys: WeakKeyStats
}

interface TestPrompt {
  text: string
  language: string | null
  usedWeakKeyFallback: boolean
}

interface SessionState {
  prompt: TestPrompt
  mode: Preferences['mode']
  duration: number
  typed: string
  status: Status
  elapsed: number
  totalKeystrokes: number
  correctKeystrokes: number
  focusVersion: number
  startedAt: number | null
  weakKeyStats: WeakKeyStats
}

export interface TypingTestDependencies {
  now?: () => number
  random?: () => number
}

const defaultNow = () => performance.now()
const defaultRandom = () => Math.random()

function createPrompt(config: Config, random: () => number): TestPrompt {
  if (config.mode === 'code') {
    const snippet = generateCodeSnippet(random)
    return { text: snippet.text, language: snippet.language, usedWeakKeyFallback: false }
  }
  if (config.mode === 'weak-keys') {
    const generated = generateWeakPracticeText(config.wordCount, config.settings, config.weakKeys, random)
    return { text: generated.text, language: null, usedWeakKeyFallback: generated.usedWeakKeyFallback }
  }
  return {
    text: generateText({
      count: config.mode === 'time' ? 250 : config.wordCount,
      settings: config.settings,
      random,
    }),
    language: null,
    usedWeakKeyFallback: false,
  }
}

export function useTypingTest(config: Config, dependencies: TypingTestDependencies = {}) {
  const configRef = useRef(config)
  configRef.current = config
  const nowRef = useRef(dependencies.now ?? defaultNow)
  nowRef.current = dependencies.now ?? defaultNow
  const randomRef = useRef(dependencies.random ?? defaultRandom)
  randomRef.current = dependencies.random ?? defaultRandom

  const initialPromptRef = useRef<TestPrompt | null>(null)
  if (initialPromptRef.current === null) {
    initialPromptRef.current = createPrompt(config, randomRef.current)
  }
  const initialState: SessionState = {
    prompt: initialPromptRef.current,
    mode: config.mode,
    duration: config.duration,
    typed: '',
    status: 'idle',
    elapsed: 0,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    focusVersion: 0,
    startedAt: null,
    weakKeyStats: {},
  }
  const sessionRef = useRef(initialState)
  const [, forceRender] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const samplesRef = useRef<number[]>([])
  const lastSampleSecondRef = useRef(0)

  const render = useCallback(() => {
    forceRender((version) => version + 1)
  }, [])

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const appendSamplesUntil = useCallback((session: SessionState, second: number) => {
    const nextSecond = Math.floor(second)
    while (lastSampleSecondRef.current < nextSecond) {
      const sampleSecond = lastSampleSecondRef.current + 1
      const stats = calcStats(
        session.prompt.text,
        session.typed,
        sampleSecond,
        session.totalKeystrokes,
        session.correctKeystrokes,
      )
      samplesRef.current.push(stats.netWpm)
      lastSampleSecondRef.current = sampleSecond
    }
  }, [])

  const finish = useCallback(
    (elapsedSec: number) => {
      const session = sessionRef.current
      if (session.status !== 'running') return
      clearTimer()
      const finalElapsed = Math.max(
        0,
        session.mode === 'time' ? Math.min(session.duration, elapsedSec) : elapsedSec,
      )
      appendSamplesUntil(session, finalElapsed)
      sessionRef.current = { ...session, elapsed: finalElapsed, status: 'finished' }
      render()
    },
    [appendSamplesUntil, clearTimer, render],
  )

  const start = useCallback(() => {
    const session = sessionRef.current
    if (session.status !== 'idle' || intervalRef.current !== null) return
    const startedAt = nowRef.current()
    sessionRef.current = { ...session, status: 'running', startedAt }
    intervalRef.current = setInterval(() => {
      const activeSession = sessionRef.current
      if (activeSession.status !== 'running' || activeSession.startedAt === null) return
      const seconds = Math.max(0, (nowRef.current() - activeSession.startedAt) / 1000)
      if (activeSession.mode === 'time' && shouldFinishTimedTest(seconds, activeSession.duration)) {
        finish(activeSession.duration)
        return
      }
      const elapsed = activeSession.mode === 'time'
        ? Math.min(activeSession.duration, seconds)
        : seconds
      const nextSession = { ...activeSession, elapsed }
      sessionRef.current = nextSession
      appendSamplesUntil(nextSession, elapsed)
      render()
    }, 100)
  }, [appendSamplesUntil, finish, render])

  const resetState = useCallback(
    (prompt: TestPrompt) => {
      clearTimer()
      const session = sessionRef.current
      const currentConfig = configRef.current
      sessionRef.current = {
        prompt,
        mode: currentConfig.mode,
        duration: currentConfig.duration,
        typed: '',
        status: 'idle',
        elapsed: 0,
        totalKeystrokes: 0,
        correctKeystrokes: 0,
        focusVersion: session.focusVersion + 1,
        startedAt: null,
        weakKeyStats: {},
      }
      samplesRef.current = []
      lastSampleSecondRef.current = 0
      render()
    },
    [clearTimer, render],
  )

  const restart = useCallback(() => resetState(sessionRef.current.prompt), [resetState])
  const newText = useCallback(
    () => resetState(createPrompt(configRef.current, randomRef.current)),
    [resetState],
  )

  useEffect(() => {
    newText()
    return clearTimer
  }, [
    config.mode,
    config.duration,
    config.wordCount,
    config.settings.punctuation,
    config.settings.numbers,
    newText,
    clearTimer,
  ])

  const onType = useCallback(
    (value: string) => {
      let session = sessionRef.current
      if (session.status === 'finished') return
      let now = nowRef.current()
      if (
        session.mode === 'time' &&
        session.status === 'running' &&
        session.startedAt !== null &&
        shouldFinishTimedTest((now - session.startedAt) / 1000, session.duration)
      ) {
        finish(session.duration)
        return
      }

      const previous = session.typed
      const maximum = session.prompt.text.length
      const next = value.slice(0, maximum)
      const isAppend = next.startsWith(previous) && next.length > previous.length
      if (isAppend) {
        if (session.status === 'idle') start()
        now = nowRef.current()
        session = sessionRef.current
        const added = next.slice(previous.length)
        let correctAdded = 0
        const keyStats = { ...session.weakKeyStats }
        for (let index = 0; index < added.length; index++) {
          const target = session.prompt.text[previous.length + index]
          if (target === undefined) throw new RangeError('Typed character exceeded prompt bounds')
          const isCorrect = added[index] === target
          if (isCorrect) correctAdded++
          const current = keyStats[target] ?? { attempts: 0, errors: 0 }
          keyStats[target] = {
            attempts: current.attempts + 1,
            errors: current.errors + (isCorrect ? 0 : 1),
          }
        }
        session = {
          ...session,
          totalKeystrokes: session.totalKeystrokes + added.length,
          correctKeystrokes: session.correctKeystrokes + correctAdded,
          weakKeyStats: keyStats,
        }
      } else if (next.length > previous.length) {
        return
      }

      session = { ...session, typed: next }
      sessionRef.current = session
      render()

      if (isAppend && session.mode !== 'time' && shouldFinishTextTest(next.length, maximum)) {
        const elapsedSec = session.startedAt === null ? 0 : (now - session.startedAt) / 1000
        finish(elapsedSec)
      }
    },
    [finish, render, start],
  )

  const session = sessionRef.current
  return {
    text: session.prompt.text,
    language: session.prompt.language,
    usedWeakKeyFallback: session.prompt.usedWeakKeyFallback,
    typed: session.typed,
    status: session.status,
    elapsed: session.elapsed,
    totalKeystrokes: session.totalKeystrokes,
    correctKeystrokes: session.correctKeystrokes,
    focusVersion: session.focusVersion,
    onType,
    restart,
    newText,
    wpmSamples: samplesRef.current,
    weakKeyStats: session.weakKeyStats,
  }
}
