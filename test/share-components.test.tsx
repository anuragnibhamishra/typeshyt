import { useRef, useState } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ShareDialog from '../src/features/share/ShareDialog'
import { renderResultCard } from '../src/features/share/renderResultCard'
import { makeResult } from './helpers'

vi.mock('../src/features/share/renderResultCard', () => ({
  renderResultCard: vi.fn(),
}))

function ShareHarness() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const result = makeResult({ wpm: 72, rawWpm: 78, accuracy: 98 })
  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>Open share</button>
      {open && (
        <ShareDialog
          result={result}
          triggerRef={triggerRef}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

describe('ShareDialog', () => {
  const originalNavigatorProperties = ['canShare', 'share', 'clipboard'].map((property) => [
    property,
    Object.getOwnPropertyDescriptor(navigator, property),
  ] as const)
  const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
  const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')
  const blob = new Blob(['png'], { type: 'image/png' })
  const revokeObjectURL = vi.fn()

  beforeEach(() => {
    vi.mocked(renderResultCard).mockResolvedValue(blob)
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    vi.stubGlobal('ClipboardItem', undefined)
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:preview') })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })
  })

  afterEach(() => {
    cleanup()
    for (const [property, descriptor] of originalNavigatorProperties) {
      if (descriptor) Object.defineProperty(navigator, property, descriptor)
      else Reflect.deleteProperty(navigator, property)
    }
    for (const [property, descriptor] of [['createObjectURL', originalCreateObjectURL], ['revokeObjectURL', originalRevokeObjectURL]] as const) {
      if (descriptor) Object.defineProperty(URL, property, descriptor)
      else Reflect.deleteProperty(URL, property)
    }
    vi.unstubAllGlobals()
  })

  it('opens, renders lazily, offers supported actions, and returns focus after Escape', async () => {
    const user = userEvent.setup()
    render(<ShareHarness />)
    const trigger = screen.getByRole('button', { name: 'Open share' })
    await user.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Share result' })).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /72 net wpm, 78 raw wpm, 98% accuracy/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Share$/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy image' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'portrait' }))
    await waitFor(() => expect(renderResultCard).toHaveBeenCalledTimes(2))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  })

  it('shows only browser-supported share and clipboard actions', async () => {
    const canShare = vi.fn(() => true)
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: canShare })
    Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn() })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { write: vi.fn() } })
    vi.stubGlobal('ClipboardItem', vi.fn())
    const user = userEvent.setup()
    render(<ShareHarness />)
    await user.click(screen.getByRole('button', { name: 'Open share' }))
    expect(await screen.findByRole('img')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Share$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy image' })).toBeInTheDocument()
  })

  it('shows a clear error when rendering the card fails', async () => {
    vi.mocked(renderResultCard).mockRejectedValueOnce(new Error('canvas failed'))
    const user = userEvent.setup()
    render(<ShareHarness />)
    await user.click(screen.getByRole('button', { name: 'Open share' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be rendered/i)
  })
})
