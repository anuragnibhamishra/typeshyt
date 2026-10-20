import { useEffect, useRef, useState } from 'react'
import type { Mode } from '../utils/words'
import { MAX_TEST_DURATION } from '../utils/storage'

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
const presetDurations = [15, 30, 60, 120]

const sectionLabelClass = 'mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500'
const segmentedGroupClass = 'inline-flex max-w-full flex-wrap gap-1 rounded-lg border border-slate-800 bg-slate-950/70 p-1'
const segmentClass = 'min-h-9 rounded-md px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-50'

function isPresetDuration(duration: number): boolean {
  return presetDurations.includes(duration)
}

export default function ModePicker({
  mode,
  wordCount,
  duration,
  disabled,
  onModeChange,
  onDurationChange,
  onWordCountChange,
}: Props) {
  const [customOpen, setCustomOpen] = useState(() => !isPresetDuration(duration))
  const [durationDraft, setDurationDraft] = useState(String(duration))
  const durationInputRef = useRef<HTMLInputElement>(null)
  const shouldFocusDurationRef = useRef(false)

  useEffect(() => {
    setDurationDraft(String(duration))
    if (!isPresetDuration(duration)) setCustomOpen(true)
  }, [duration])

  useEffect(() => {
    if (customOpen && shouldFocusDurationRef.current) {
      shouldFocusDurationRef.current = false
      durationInputRef.current?.focus()
    }
  }, [customOpen])

  const customDuration = /^\d+$/.test(durationDraft) ? Number(durationDraft) : Number.NaN
  const validCustomDuration =
    Number.isInteger(customDuration) && customDuration >= 1 && customDuration <= MAX_TEST_DURATION

  const applyCustomDuration = () => {
    if (validCustomDuration) onDurationChange(customDuration)
  }

  const selectPreset = (seconds: number) => {
    setCustomOpen(false)
    setDurationDraft(String(seconds))
    onDurationChange(seconds)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className={sectionLabelClass}>Mode</p>
        <div role="group" aria-label="Test mode" className={segmentedGroupClass}>
          {modeOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              disabled={disabled}
              aria-pressed={mode === option.value}
              onClick={() => onModeChange(option.value)}
              className={`${segmentClass} ${
                mode === option.value
                  ? 'bg-brand-500 font-bold text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'time' || mode === 'code' ? (
        <div>
          <p className={sectionLabelClass}>Duration</p>
          <div role="group" aria-label="Test duration" className={segmentedGroupClass}>
            {presetDurations.map((seconds) => (
              <button
                type="button"
                key={seconds}
                disabled={disabled}
                aria-pressed={!customOpen && duration === seconds}
                onClick={() => selectPreset(seconds)}
                className={`${segmentClass} font-mono ${
                  !customOpen && duration === seconds
                    ? 'bg-brand-500 font-bold text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {seconds}s
              </button>
            ))}
            <button
              type="button"
              disabled={disabled}
              aria-pressed={customOpen}
              onClick={() => {
                if (customOpen) {
                  durationInputRef.current?.focus()
                } else {
                  shouldFocusDurationRef.current = true
                  setCustomOpen(true)
                }
              }}
              className={`${segmentClass} ${
                customOpen
                  ? 'bg-brand-500 font-bold text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Custom
            </button>
          </div>
          <div
            className={`grid transition-[grid-template-rows,opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
              customOpen ? 'grid-rows-[1fr] translate-y-0 opacity-100' : 'grid-rows-[0fr] -translate-y-1 opacity-0'
            }`}
            aria-hidden={!customOpen}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label htmlFor="custom-duration" className="mb-1.5 block text-sm text-slate-300">
                    Custom duration
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={durationInputRef}
                      id="custom-duration"
                      type="number"
                      min={1}
                      max={MAX_TEST_DURATION}
                      step={1}
                      value={durationDraft}
                      disabled={disabled || !customOpen}
                      onChange={(event) => setDurationDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          applyCustomDuration()
                        }
                      }}
                      aria-label="Custom duration in seconds"
                      aria-invalid={durationDraft.length > 0 && !validCustomDuration}
                      aria-describedby="custom-duration-help"
                      className="min-h-10 w-full max-w-40 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 focus:border-brand-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <span className="text-sm text-slate-400">seconds</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={disabled || !customOpen || !validCustomDuration}
                  onClick={applyCustomDuration}
                  className="min-h-10 rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-brand-500/60 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              <p id="custom-duration-help" className="pt-1.5 text-xs text-slate-500">
                Enter a whole number from 1 to {MAX_TEST_DURATION}.
              </p>
            </div>
          </div>
        </div>
      ) : (mode === 'words' || mode === 'weak-keys') ? (
        <div>
          <p className={sectionLabelClass}>Word count</p>
          <div role="group" aria-label="Word count" className={segmentedGroupClass}>
            {([10, 25, 50] as const).map((count) => (
              <button
                type="button"
                key={count}
                disabled={disabled}
                aria-pressed={wordCount === count}
                onClick={() => onWordCountChange(count)}
                className={`${segmentClass} font-mono ${
                  wordCount === count
                    ? 'bg-brand-500 font-bold text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
