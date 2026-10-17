import type { Mode } from '../utils/words'

interface Props {
  mode: Mode
  wordCount: 10 | 25 | 50
  duration: number
  disabled: boolean
  onModeChange: (mode: Mode) => void
  onDurationChange: (duration: number) => void
  onWordCountChange: (count: 10 | 25 | 50) => void
}

const modeOptions: { value: Mode; label: string }[] = [
  { value: 'time', label: 'Time' },
  { value: 'words', label: 'Words' },
  { value: 'code', label: 'Code' },
  { value: 'weak-keys', label: 'Weak keys' },
]

export default function ModePicker({
  mode,
  wordCount,
  duration,
  disabled,
  onModeChange,
  onDurationChange,
  onWordCountChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Test mode" className="inline-flex flex-wrap rounded-lg bg-slate-900 p-1">
        {modeOptions.map((option) => (
          <button
            type="button"
            key={option.value}
            disabled={disabled}
            aria-pressed={mode === option.value}
            onClick={() => onModeChange(option.value)}
            className={`rounded-md px-2.5 py-1.5 text-sm transition-colors disabled:cursor-not-allowed sm:px-3 ${
              mode === option.value ? 'bg-brand-500 font-bold text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {mode === 'time' ? (
        <div role="group" aria-label="Test duration" className="inline-flex rounded-lg bg-slate-900 p-1">
          {[15, 30, 60, 120].map((seconds) => (
            <button
              type="button"
              key={seconds}
              disabled={disabled}
              aria-pressed={duration === seconds}
              onClick={() => onDurationChange(seconds)}
              className={`rounded-md px-2.5 py-1.5 font-mono text-sm transition-colors disabled:cursor-not-allowed ${
                duration === seconds ? 'bg-brand-500 font-bold text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              {seconds}s
            </button>
          ))}
        </div>
      ) : (mode === 'words' || mode === 'weak-keys') ? (
        <div role="group" aria-label="Word count" className="inline-flex rounded-lg bg-slate-900 p-1">
          {([10, 25, 50] as const).map((count) => (
            <button
              type="button"
              key={count}
              disabled={disabled}
              aria-pressed={wordCount === count}
              onClick={() => onWordCountChange(count)}
              className={`rounded-md px-3 py-1.5 font-mono text-sm transition-colors disabled:cursor-not-allowed ${
                wordCount === count ? 'bg-brand-500 font-bold text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      ) : (
        <span className="rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-400">Type the complete snippet</span>
      )}
    </div>
  )
}
