import { StrictMode } from 'react'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import type { AppData } from '../src/utils/storage'

const STORAGE_KEY = 'typeshyt:state:v2'

async function completeShortWordsTest(): Promise<AppData> {
  const user = userEvent.setup()
  const modePicker = screen.getByRole('group', { name: 'Test mode' })
  await user.click(within(modePicker).getByRole('button', { name: 'Words' }))
  await user.click(within(screen.getByRole('group', { name: 'Word count' })).getByRole('button', { name: '10' }))

  const input = screen.getByRole('textbox', { name: /typing input.*tab to restart/i })
  const descriptionIds = input.getAttribute('aria-describedby')?.split(/\s+/) ?? []
  const promptId = descriptionIds[0]
  const prompt = promptId ? document.getElementById(promptId)?.textContent ?? '' : ''
  expect(prompt.trim().split(/\s+/)).toHaveLength(10)

  await user.type(input, prompt.slice(0, 1))
  await vi.advanceTimersByTimeAsync(1_000)
  await user.type(input, prompt.slice(1))
  await screen.findByRole('heading', { name: /test complete/i })

  const saved = localStorage.getItem(STORAGE_KEY)
  expect(saved).not.toBeNull()
  return JSON.parse(saved ?? '{}') as AppData
}

describe('App end-to-end test flow', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['Date', 'performance', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(new Date('2025-01-01T12:00:00.000Z'))
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('persists a complete words test and updates the matching personal best', async () => {
    render(<StrictMode><App /></StrictMode>)
    const data = await completeShortWordsTest()
    expect(data.history).toHaveLength(1)
    const result = data.history[0]
    expect(result).toBeDefined()
    if (!result) throw new Error('Completed test was not saved to history')
    expect(result).toMatchObject({ mode: 'words', wordCount: 10, wpm: expect.any(Number) })
    expect(result.elapsedSec).toBeGreaterThanOrEqual(1)
    expect(result.wpm).toBeGreaterThan(0)
    expect(screen.getByText(`${result.wpm} Net WPM`)).toBeInTheDocument()
    expect(data.weakKeys).not.toEqual({})
  }, 20_000)

  it('recovers from corrupted storage and remains usable', async () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    render(<StrictMode><App /></StrictMode>)
    expect(screen.getByRole('textbox', { name: /typing input/i })).toBeInTheDocument()

    const data = await completeShortWordsTest()
    expect(data.schemaVersion).toBe(2)
    expect(data.history).toHaveLength(1)
    await waitFor(() => expect(screen.getByRole('heading', { name: /test complete/i })).toBeInTheDocument())
  }, 20_000)

  it('reveals custom controls on demand and hides controls irrelevant to the selected mode', async () => {
    const user = userEvent.setup()
    render(<StrictMode><App /></StrictMode>)

    const durationGroup = screen.getByRole('group', { name: 'Test duration' })
    expect(screen.queryByRole('spinbutton', { name: 'Custom duration in seconds' })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Custom typing text' })).not.toBeInTheDocument()

    await user.click(within(durationGroup).getByRole('button', { name: 'Custom' }))
    const durationInput = screen.getByRole('spinbutton', { name: 'Custom duration in seconds' })
    await user.clear(durationInput)
    await user.type(durationInput, '45')
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(screen.getByText(/Timed test · 45 seconds/)).toBeInTheDocument()

    await user.click(within(screen.getByRole('group', { name: 'Text source' })).getByRole('button', { name: 'Custom' }))
    const customTextInput = screen.getByRole('textbox', { name: 'Custom typing text' })
    expect(customTextInput).toHaveFocus()
    await user.type(customTextInput, 'Practice this custom passage.')
    await user.click(screen.getByRole('button', { name: 'Use custom text' }))
    expect(screen.getByText(/Custom text test · 45 seconds/)).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
      preferences: { duration: 45, customText: 'Practice this custom passage.' },
    })

    await user.click(within(screen.getByRole('group', { name: 'Text source' })).getByRole('button', { name: 'Generated' }))
    expect(screen.queryByRole('textbox', { name: 'Custom typing text' })).not.toBeInTheDocument()
    expect(screen.getByText(/Timed test · 45 seconds/)).toBeInTheDocument()
    await user.click(within(screen.getByRole('group', { name: 'Test mode' })).getByRole('button', { name: 'Words' }))
    expect(screen.queryByRole('group', { name: 'Test duration' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Text source' })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Word count' })).toBeInTheDocument()
  }, 20_000)
})
