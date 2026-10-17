import { createEvent, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import HistoryPanel from '../src/components/HistoryPanel'
import ModePicker from '../src/components/ModePicker'
import Results from '../src/components/Results'
import SettingsToggles from '../src/components/SettingsToggles'
import TypingArea from '../src/components/TypingArea'
import WeakKeysPanel from '../src/components/WeakKeysPanel'
import WpmChart from '../src/components/WpmChart'
import type { TestResult } from '../src/utils/storage'
import { makeResult } from './helpers'

describe('TypingArea', () => {
  it('exposes the prompt, shortcut instructions, and distinct character states', () => {
    render(
      <TypingArea
        text="abcd"
        typed="ax"
        finished={false}
        codeMode={false}
        focusVersion={0}
        onChange={vi.fn()}
        onRestart={vi.fn()}
      />,
    )
    const input = screen.getByRole('textbox', { name: /press tab to restart/i })
    expect(input).toHaveAccessibleDescription(/abcd/)
    expect(input).toHaveAccessibleDescription(/Escape to release focus/)

    const visualPrompt = document.querySelector('[aria-hidden="true"]')
    expect(visualPrompt?.querySelector('[data-character-state="correct"]')).toHaveTextContent('a')
    expect(visualPrompt?.querySelector('[data-character-state="incorrect"]')).toHaveTextContent('b')
    expect(visualPrompt?.querySelector('[data-character-state="current"]')).toHaveTextContent('c')
    expect(visualPrompt?.querySelector('[data-character-state="untyped"]')).toHaveTextContent('d')
  })

  it('blocks paste and cursor movement', () => {
    const onChange = vi.fn()
    render(
      <TypingArea
        text="prompt"
        typed=""
        finished={false}
        codeMode={false}
        focusVersion={0}
        onChange={onChange}
        onRestart={vi.fn()}
      />,
    )
    const input = screen.getByRole('textbox')
    const paste = createEvent.paste(input, { clipboardData: { getData: () => 'pasted' } })
    fireEvent(input, paste)
    expect(paste.defaultPrevented).toBe(true)
    expect(onChange).not.toHaveBeenCalled()

    const arrow = createEvent.keyDown(input, { key: 'ArrowLeft' })
    fireEvent(input, arrow)
    expect(arrow.defaultPrevented).toBe(true)
  })

  it('restarts with Tab and releases focus with Escape', async () => {
    const onRestart = vi.fn()
    render(
      <TypingArea
        text="prompt"
        typed=""
        finished={false}
        codeMode={false}
        focusVersion={0}
        onChange={vi.fn()}
        onRestart={onRestart}
      />,
    )
    const input = screen.getByRole('textbox')
    await waitFor(() => expect(input).toHaveFocus())
    const tab = createEvent.keyDown(input, { key: 'Tab' })
    fireEvent(input, tab)
    expect(tab.defaultPrevented).toBe(true)
    expect(onRestart).toHaveBeenCalledOnce()

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input).not.toHaveFocus()
  })
})

describe('test controls and results', () => {
  it('changes modes and durations and disables selectors during a run', async () => {
    const user = userEvent.setup()
    const onModeChange = vi.fn()
    const onDurationChange = vi.fn()
    const onWordCountChange = vi.fn()
    const props = {
      mode: 'time' as const,
      wordCount: 10 as const,
      duration: 30,
      disabled: false,
      onModeChange,
      onDurationChange,
      onWordCountChange,
    }
    const { rerender } = render(<ModePicker {...props} />)
    await user.click(screen.getByRole('button', { name: '15s' }))
    expect(onDurationChange).toHaveBeenCalledWith(15)
    await user.click(screen.getByRole('button', { name: 'Words' }))
    expect(onModeChange).toHaveBeenCalledWith('words')
    rerender(<ModePicker {...props} disabled />)
    expect(screen.getByRole('button', { name: 'Time' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '30s' })).toBeDisabled()
    rerender(<ModePicker {...props} mode="code" />)
    expect(screen.getByText('Type the complete snippet')).toBeInTheDocument()
  })

  it('updates labeled text settings', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <SettingsToggles
        settings={{ punctuation: false, numbers: false }}
        disabled={false}
        onChange={onChange}
      />,
    )
    await user.click(screen.getByRole('checkbox', { name: 'Punctuation' }))
    expect(onChange).toHaveBeenCalledWith({ punctuation: true, numbers: false })
  })

  it('shows shared results metrics and an empty state for short chart data', async () => {
    const result = makeResult({
      wpm: 52,
      rawWpm: 61,
      accuracy: 92.5,
      correctChars: 50,
      incorrectChars: 4,
      wpmSamples: [],
    })

    render(<Results result={result} best={55} storageAvailable onShare={vi.fn()} onRestart={vi.fn()} />)
    expect(screen.getByText('52')).toBeInTheDocument()
    expect(screen.getByText('Net WPM')).toBeInTheDocument()
    expect(screen.getByText('61')).toBeInTheDocument()
    expect(screen.getByText('92.5%')).toBeInTheDocument()
    expect(screen.getByText('55 Net WPM')).toBeInTheDocument()
    expect(screen.getByText(/needs at least two one-second samples/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('heading', { name: /test complete/i })).toHaveFocus())
  })
})

describe('statistics charts and weak-key panel', () => {
  it('shows an accessible empty state or a chart summary for WPM samples', () => {
    const { rerender } = render(<WpmChart samples={[]} />)
    expect(screen.getByText(/needs at least two one-second samples/i)).toBeInTheDocument()
    rerender(<WpmChart samples={[10, 20]} />)
    expect(screen.getByRole('img', { name: /average 15, peak 20 wpm/i })).toBeInTheDocument()
    expect(screen.getByText(/average 15, peak 20 wpm over 2 seconds/i)).toBeInTheDocument()
  })

  it('shows eligible weak keys, improvement and reset action', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    const history = Array.from({ length: 10 }, (_, index) =>
      makeResult({
        id: String(index),
        weakKeyStats: { a: { attempts: 20, errors: index < 5 ? 10 : 2 } },
      }),
    )
    render(
      <WeakKeysPanel
        stats={{ a: { attempts: 200, errors: 60 }, b: { attempts: 19, errors: 18 } }}
        history={history}
        onReset={onReset}
      />,
    )
    expect(screen.getByText(/30\.0% errors · 60\/200/i)).toBeInTheDocument()
    expect(screen.getByText('improving recently')).toBeInTheDocument()
    expect(screen.getByText(/keyboard layouts/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reset key stats' }))
    expect(onReset).toHaveBeenCalledOnce()
  })
})

describe('HistoryPanel', () => {
  it('shows a clear empty state', () => {
    render(<HistoryPanel history={[]} legacyBests={{}} onShare={vi.fn()} onClear={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Test history' })).toBeInTheDocument()
    expect(screen.getByText(/no completed tests yet/i)).toBeInTheDocument()
  })

  it('lists results and confirms before clearing history', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    const history: TestResult[] = [makeResult({ id: 'first', wpm: 42 })]
    render(<HistoryPanel history={history} legacyBests={{}} onShare={vi.fn()} onClear={onClear} />)
    const row = screen.getByRole('row', { name: /time · 30s/i })
    expect(within(row).getByText('42')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear history' }))
    expect(screen.getByText('Delete all results?')).toBeInTheDocument()
    expect(onClear).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('provides an accessible secondary share action for each stored result', async () => {
    const user = userEvent.setup()
    const onShare = vi.fn()
    const result = makeResult({ id: 'shareable', completedAt: '2025-02-03T12:00:00.000Z', wpmSamples: [1, 2, 3] })
    render(<HistoryPanel history={[result]} legacyBests={{}} onShare={onShare} onClear={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /^Share result from/ }))
    expect(onShare).toHaveBeenCalledWith(result, expect.any(HTMLButtonElement))
    expect(result.wpmSamples).toEqual([1, 2, 3])
  })
})
