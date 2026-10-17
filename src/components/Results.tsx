import { useEffect, useRef } from 'react'
import { averageWpm, peakWpm } from '../utils/stats'
import type { TestResult } from '../utils/storage'
import WpmChart from './WpmChart'

interface Props {
  result: TestResult
  best: number
  storageAvailable: boolean
  onRestart: () => void
}

function modeLabel(result: TestResult): string {
  if (result.mode === 'time') return `Time · ${result.duration}s`
  if (result.variant === 'code') return `Code · ${result.language}`
  if (result.variant === 'weak-keys') return `Weak keys · ${result.wordCount} words`
  return `Words · ${result.wordCount}`
}

export default function Results({ result, best, storageAvailable, onRestart }: Props) {
  const average = averageWpm(result.wpmSamples)
  const peak = peakWpm(result.wpmSamples)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [result.id])

  return (
    <section className="rounded-xl bg-slate-900/80 p-5 ring-1 ring-slate-800 sm:p-8">
      <h2 ref={headingRef} tabIndex={-1} className="text-sm font-medium text-slate-400">
        Test complete · {modeLabel(result)}
      </h2>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-6xl font-bold tabular-nums text-brand-400 sm:text-7xl">{result.wpm}</span>
        <span className="text-lg text-slate-200">Net WPM</span>
        <span className="text-sm text-slate-400">
          ({result.correctChars} correct characters; incorrect characters excluded)
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Summary label="Average WPM" value={average} />
        <Summary label="Peak WPM" value={peak} />
        <Summary label="Raw WPM" value={result.rawWpm} />
        <Summary label="Accuracy" value={`${result.accuracy}%`} />
      </div>
      <p className="mt-2 text-xs text-slate-400">Accuracy is measured from correct keystrokes.</p>

      <div className="mt-6">
        <h2 className="mb-2 font-semibold text-white">Net WPM over time</h2>
        <WpmChart samples={result.wpmSamples} />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
        {[
          ['Correct characters', result.correctChars],
          ['Incorrect characters', result.incorrectChars],
          ['Correct / total keystrokes', `${result.correctKeystrokes} / ${result.totalKeystrokes}`],
          ['Elapsed time', `${result.elapsedSec.toFixed(1)}s`],
          ['Personal best', `${best} Net WPM`],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dd className="break-words font-mono text-xl font-bold text-white">{value}</dd>
            <dt className="text-sm text-slate-400">{label}</dt>
          </div>
        ))}
      </dl>

      {!storageAvailable && (
        <p role="status" className="mt-6 text-sm text-amber-300">
          Browser storage is unavailable. This result may not persist after closing the page.
        </p>
      )}

      <button
        type="button"
        onClick={onRestart}
        className="mt-8 rounded-lg bg-brand-500 px-5 py-3 font-bold text-slate-950 transition-colors hover:bg-brand-400"
      >
        Try again
      </button>
    </section>
  )
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-950/60 p-3">
      <div className="font-mono text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  )
}
