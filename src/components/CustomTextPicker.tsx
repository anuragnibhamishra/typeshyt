import { useEffect, useRef, useState } from 'react'
import { MAX_CUSTOM_TEXT_LENGTH } from '../utils/storage'

interface Props {
  value: string
  disabled: boolean
  onApply: (text: string) => void
}

const segmentedGroupClass = 'inline-flex max-w-full flex-wrap gap-1 rounded-lg border border-slate-800 bg-slate-950/70 p-1'
const segmentClass = 'min-h-9 rounded-md px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-50'

export default function CustomTextPicker({ value, disabled, onApply }: Props) {
  const [draft, setDraft] = useState(value)
  const [customSelected, setCustomSelected] = useState(() => Boolean(value.trim()))
  const textInputRef = useRef<HTMLTextAreaElement>(null)
  const shouldFocusTextRef = useRef(false)
  const customTextIsActive = Boolean(value.trim())
  const canApply = Boolean(draft.trim()) && draft.length <= MAX_CUSTOM_TEXT_LENGTH && draft !== value

  useEffect(() => {
    if (customSelected && shouldFocusTextRef.current) {
      shouldFocusTextRef.current = false
      textInputRef.current?.focus()
    }
  }, [customSelected])

  const selectGenerated = () => {
    setCustomSelected(false)
    if (customTextIsActive) onApply('')
  }

  const selectCustom = () => {
    if (customSelected) {
      textInputRef.current?.focus()
    } else {
      shouldFocusTextRef.current = true
      setCustomSelected(true)
    }
  }

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Text source</p>
      <div role="group" aria-label="Text source" className={segmentedGroupClass}>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={!customSelected}
          onClick={selectGenerated}
          className={`${segmentClass} ${
            !customSelected ? 'bg-brand-500 font-bold text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          Generated
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={customSelected}
          onClick={selectCustom}
          className={`${segmentClass} ${
            customSelected ? 'bg-brand-500 font-bold text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          Custom
        </button>
      </div>
      <div
        className={`grid transition-[grid-template-rows,opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
          customSelected ? 'grid-rows-[1fr] translate-y-0 opacity-100' : 'grid-rows-[0fr] -translate-y-1 opacity-0'
        }`}
        aria-hidden={!customSelected}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-2 pt-3">
            <label htmlFor="custom-test-text" className="text-sm font-medium text-slate-300">
              Custom typing text
            </label>
            <textarea
              ref={textInputRef}
              id="custom-test-text"
              value={draft}
              maxLength={MAX_CUSTOM_TEXT_LENGTH}
              disabled={disabled || !customSelected}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Paste or type text to practice"
              rows={2}
              className="min-h-20 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span aria-live="polite">{draft.length} / {MAX_CUSTOM_TEXT_LENGTH} characters</span>
              <div className="flex flex-wrap gap-2">
                {customSelected && customTextIsActive && (
                  <button
                    type="button"
                    disabled={disabled || !customSelected}
                    onClick={selectGenerated}
                    className="min-h-9 rounded-md px-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Use generated text
                  </button>
                )}
                <button
                  type="button"
                  disabled={disabled || !customSelected || !canApply}
                  onClick={() => onApply(draft)}
                  className="min-h-9 rounded-md border border-slate-700 px-3 text-slate-200 transition-colors hover:border-brand-500/60 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Use custom text
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
