import { getKeyErrorRate, getKeyImprovement, getWeakestKeys, MIN_WEAK_KEY_ATTEMPTS } from '../utils/weakKeys'
import type { TestResult, WeakKeyStats } from '../utils/storage'

interface Props {
  stats: WeakKeyStats
  history: TestResult[]
  onReset: () => void
}

export default function WeakKeysPanel({ stats, history, onReset }: Props) {
  const weakest = getWeakestKeys(stats)

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Weak-key analysis</h2>
          <p className="text-sm text-slate-400">
            A key appears after at least {MIN_WEAK_KEY_ATTEMPTS} target-character attempts.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
        >
          Reset key stats
        </button>
      </div>

      <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
        Key analysis assumes the target character matches the physical key. Results may differ across keyboard layouts
        and for shifted symbols.
      </p>

      {weakest.length === 0 ? (
        <p className="rounded-xl bg-slate-900/70 p-6 text-center text-slate-400">
          Not enough data yet. Keep typing; each character needs at least {MIN_WEAK_KEY_ATTEMPTS} attempts.
        </p>
      ) : (
        <ul className="divide-y divide-slate-800 rounded-xl bg-slate-900/60 px-4">
          {weakest.map(([key, counter]) => {
            const rate = getKeyErrorRate(counter.attempts, counter.errors)
            const improvement = getKeyImprovement(history, key)
            return (
              <li key={key} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <kbd className="min-w-10 rounded-md bg-slate-800 px-3 py-1 text-center font-mono text-lg text-brand-300">
                    {key === ' ' ? 'space' : key}
                  </kbd>
                  <span className="text-sm text-slate-300">
                    {(rate * 100).toFixed(1)}% errors · {counter.errors}/{counter.attempts}
                  </span>
                </div>
                {improvement && <span className="text-xs capitalize text-slate-400">{improvement} recently</span>}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
