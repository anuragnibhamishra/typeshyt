import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import UpdateToast from '../src/features/pwa/UpdateToast'
import { useInstallPrompt } from '../src/features/pwa/useInstallPrompt'

describe('useInstallPrompt', () => {
  it('captures the Chromium install event and exposes its prompt result', async () => {
    const { result } = renderHook(() => useInstallPrompt())
    const prompt = vi.fn().mockResolvedValue(undefined)
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
    })
    act(() => window.dispatchEvent(event))
    expect(event.defaultPrevented).toBe(true)
    expect(result.current.canInstall).toBe(true)
    await act(async () => {
      await expect(result.current.promptInstall()).resolves.toBe('accepted')
    })
    expect(prompt).toHaveBeenCalledOnce()
    expect(result.current.isInstalled).toBe(true)
    expect(result.current.canInstall).toBe(false)
  })

  it('detects standalone display mode as installed', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((media) => ({
      matches: media === '(display-mode: standalone)',
      media,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }))
    const { result } = renderHook(() => useInstallPrompt())
    expect(result.current.isInstalled).toBe(true)
  })
})

describe('PWA update toast', () => {
  it('does not reload by itself and prevents reloading during a running test', async () => {
    const user = userEvent.setup()
    const onReload = vi.fn()
    const props = {
      updateReady: true,
      registrationError: false,
      testRunning: true,
      onReload,
      onDismiss: vi.fn(),
    }
    const { rerender } = render(<UpdateToast {...props} />)
    expect(onReload).not.toHaveBeenCalled()
    const reload = screen.getByRole('button', { name: 'Finish test to reload' })
    expect(reload).toBeDisabled()
    await user.click(reload)
    expect(onReload).not.toHaveBeenCalled()

    rerender(<UpdateToast {...props} testRunning={false} />)
    await user.click(screen.getByRole('button', { name: 'Reload' }))
    expect(onReload).toHaveBeenCalledOnce()
  })
})
