import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'

interface Props {
  text: string
  typed: string
  finished: boolean
  codeMode: boolean
  focusVersion: number
  onChange: (value: string) => void
  onRestart: () => void
}

interface CharacterProps {
  character: string
  typedCharacter: string | undefined
  current: boolean
  caretRef?: RefObject<HTMLSpanElement>
}

const Character = memo(function Character({ character, typedCharacter, current, caretRef }: CharacterProps) {
  const state = current
    ? 'current'
    : typedCharacter === undefined
      ? 'untyped'
      : typedCharacter === character
        ? 'correct'
        : 'incorrect'
  const className = state === 'current'
    ? 'rounded-sm bg-brand-400 px-0.5 text-slate-950 ring-2 ring-brand-300'
    : state === 'incorrect'
      ? 'rounded-sm bg-red-500/25 text-red-300 underline decoration-red-400 decoration-2 underline-offset-4'
      : state === 'correct'
        ? 'text-brand-300'
        : 'text-slate-400'

  return (
    <span ref={caretRef} data-character-state={state} className={className}>
      {character}
    </span>
  )
})

export default function TypingArea({ text, typed, finished, codeMode, focusVersion, onChange, onRestart }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const caretRef = useRef<HTMLSpanElement>(null)
  const [focused, setFocused] = useState(false)
  const characters = useMemo(() => text.split(''), [text])

  useEffect(() => {
    const input = inputRef.current
    input?.focus({ preventScroll: true })
    setFocused(input !== null && input?.ownerDocument.activeElement === input)
  }, [focusVersion])

  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return

    const keepCaretVisible = () => {
      const caret = caretRef.current
      if (!caret) return
      const boxRect = box.getBoundingClientRect()
      const caretRect = caret.getBoundingClientRect()
      const top = caretRect.top - boxRect.top + box.scrollTop
      const bottom = top + caretRect.height

      if (top < box.scrollTop) box.scrollTop = top
      else if (bottom > box.scrollTop + box.clientHeight) {
        box.scrollTop = bottom - box.clientHeight
      }
    }

    keepCaretVisible()
    const observer = new ResizeObserver(keepCaretVisible)
    observer.observe(box)
    window.addEventListener('resize', keepCaretVisible)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', keepCaretVisible)
    }
  }, [text, typed.length])

  return (
    <div
      className={`relative rounded-xl bg-slate-900/80 p-4 ring-1 transition-colors sm:p-6 ${
        focused ? 'ring-brand-400' : 'ring-slate-700'
      }`}
    >
      <div
        ref={boxRef}
        aria-hidden="true"
        className="relative h-[180px] select-none overflow-hidden break-words whitespace-pre-wrap font-mono text-xl leading-9 sm:h-[200px] sm:text-2xl sm:leading-10"
      >
        {characters.map((character, index) => (
          <Character
            key={index}
            character={character}
            typedCharacter={typed[index]}
            current={index === typed.length}
            caretRef={index === typed.length ? caretRef : undefined}
          />
        ))}
      </div>

      <p id="typing-prompt" className="sr-only">{text}</p>
      <p id="typing-input-help" className="sr-only">
        Press Tab to restart this test. Press Escape to release focus. Paste and cursor movement are disabled.
      </p>

      {!focused && !finished && (
        <p className="pointer-events-none absolute inset-0 backdrop-blur-sm grid place-items-center rounded-xl bg-slate-950/35 px-4 text-center text-sm font-medium text-white sm:text-base">
          Click or tap the text area to focus
        </p>
      )}

      <textarea
        ref={inputRef}
        value={typed}
        disabled={finished}
        aria-label={`${codeMode ? 'Code typing input' : 'Typing input'}. Press Tab to restart. Press Escape to release focus.`}
        aria-describedby="typing-prompt typing-input-help"
        rows={1}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        inputMode="text"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPaste={(e) => e.preventDefault()}
        onSelect={(e) => {
          const input = e.currentTarget
          if (input.selectionStart !== typed.length || input.selectionEnd !== typed.length) {
            input.setSelectionRange(typed.length, typed.length)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault()
            onRestart()
            return
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            inputRef.current?.blur()
            return
          }
          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Delete'].includes(e.key)) {
            e.preventDefault()
          }
        }}
        className="absolute inset-0 h-full w-full resize-none cursor-text overflow-hidden whitespace-pre text-base opacity-0"
      />

    </div>
  )
}
