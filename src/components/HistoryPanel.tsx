import { useMemo, useState } from 'react'
import { averageWpm, getProgressTrend } from '../utils/stats'
import type { TestResult } from '../utils/storage'
import type { Mode } from '../utils/words'

type Filter = Mode | 'all'

interface Props {
  history: TestResult[]
  legacyBests: Record<string, number>
  onShare: (result: TestResult, trigger: HTMLButtonElement) => void
  onClear: () => void
}

function labelFor(result: TestResult): string {
  if (result.mode === 'time') return `Time · ${result.duration}s`
  if (result.variant === 'code') return `Code · ${result.language}`
  if (result.variant === 'weak-keys') return `Weak keys · ${result.wordCount} words`
  return `Words · ${result.wordCount}`
}

function matchesFilter(result: TestResult, filter: Filter): boolean {
  if (filter === 'all') return true
  if (filter === 'time') return result.mode === 'time'
  if (filter === 'code') return result.mode === 'words' && result.variant === 'code'
  if (filter === 'weak-keys') return result.mode === 'words' && result.variant === 'weak-keys'
  return result.mode === 'words' && result.variant === undefined
}

export default function HistoryPanel({ history, legacyBests, onShare, onClear }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [confirming, setConfirming] = useState(false)
  const visible = useMemo(() => history.filter((result) => matchesFilter(result, filter)), [history, filter])
  const newest = [...visible].reverse()
  const allWpm = visible.map((result) => result.wpm)
  const trend = getProgressTrend(allWpm)
  const sparkline = allWpm.slice(-20).reverse()
  const maxWpm = Math.max(1, ...sparkline)
  const points = sparkline.map((wpm, index) => {
    const x = sparkline.length < 2 ? 0 : (index / (sparkline.length - 1)) * 200
    const y = 36 - (wpm / maxWpm) * 32
    return `${x},${y}`
  })

  return (
    <section aria-labelledby="history-heading" className="flex flex-col gap-6">
      <h2 id="history-heading" className="sr-only">Test history</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Summary label="Tests shown" value={visible.length} />
        <Summary label="Last 10 avg. WPM" value={averageWpm(allWpm.slice(-10))} />
        <Summary label="All-time avg. WPM" value={averageWpm(allWpm)} />
        <Summary label="Best WPM" value={allWpm.length ? Math.max(...allWpm) : 0} />
      </div>
      {Object.keys(legacyBests).length > 0 && (
        <p className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">
          Archived Phase 1 bests (not included in the history-derived personal best):
          {' '}{Object.entries(legacyBests).map(([duration, best]) => `${duration}s: ${best} WPM`).join(' · ')}
        </p>
      )}

      {history.length === 0 ? (
        <div className="rounded-xl bg-slate-900/70 p-8 text-center text-slate-400">
          No completed tests yet. Your results will appear here.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              Filter
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as Filter)}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              >
                <option value="all">All modes</option>
                <option value="time">Time</option>
                <option value="words">Words</option>
                <option value="code">Code</option>
                <option value="weak-keys">Weak keys</option>
              </select>
            </label>
            <div className="flex items-center gap-3">
              {sparkline.length >= 2 && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <svg
                    viewBox="0 0 200 40"
                    className="h-8 w-28"
                    role="img"
                    aria-label={`Recent WPM trend: ${allWpm.length >= 10 ? trend : 'not enough tests yet'}`}
                  >
                    <polyline points={points.join(' ')} fill="none" stroke="#34d399" strokeWidth="2.5" />
                  </svg>
                  <span>{allWpm.length >= 10 ? trend : 'trend needs 10 tests'}</span>
                </div>
              )}
              {!confirming ? (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="rounded-md border border-red-900 px-3 py-2 text-sm text-red-300 hover:bg-red-950"
                >
                  Clear history
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-red-200">Delete all results?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClear()
                      setConfirming(false)
                    }}
                    className="rounded-md bg-red-700 px-3 py-2 font-semibold text-white hover:bg-red-600"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="rounded-md bg-slate-800 px-3 py-2 text-white hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-xl bg-slate-900/70 p-6 text-center text-slate-400">No results for this mode yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-800">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Date</th>
                    <th scope="col" className="px-4 py-3 font-medium">Mode</th>
                    <th scope="col" className="px-4 py-3 font-medium">Net WPM</th>
                    <th scope="col" className="px-4 py-3 font-medium">Raw WPM</th>
                    <th scope="col" className="px-4 py-3 font-medium">Accuracy</th>
                    <th scope="col" className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/50">
                  {newest.map((result) => (
                    <tr key={result.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                        {new Date(result.completedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{labelFor(result)}</td>
                      <td className="px-4 py-3 font-mono text-brand-300">{result.wpm}</td>
                      <td className="px-4 py-3 font-mono text-slate-200">{result.rawWpm}</td>
                      <td className="px-4 py-3 font-mono text-slate-200">{result.accuracy}%</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={(event) => onShare(result, event.currentTarget)}
                          aria-label={`Share result from ${new Date(result.completedAt).toLocaleDateString()}`}
                          className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-brand-200 hover:bg-slate-800"
                        >
                          Share
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-900/70 p-4 ring-1 ring-slate-800">
      <div className="font-mono text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  )
}
