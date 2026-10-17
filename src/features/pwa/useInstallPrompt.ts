import { useCallback, useEffect, useState } from 'react'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export type InstallPromptResult = 'accepted' | 'dismissed' | 'unavailable' | 'error'

function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function isIosSafari(): boolean {
  const userAgent = navigator.userAgent
  const iosDevice = /iPhone|iPad|iPod/.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return iosDevice && /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent)
}

export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isStandalone)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    setIsIos(isIosSafari())
    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as InstallPromptEvent)
    }
    const onInstalled = () => {
      setIsInstalled(true)
      setInstallEvent(null)
    }
    const onDisplayModeChange = () => setIsInstalled(isStandalone())
    const standalone = window.matchMedia?.('(display-mode: standalone)')

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    standalone?.addEventListener('change', onDisplayModeChange)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      standalone?.removeEventListener('change', onDisplayModeChange)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<InstallPromptResult> => {
    if (!installEvent) return 'unavailable'
    try {
      await installEvent.prompt()
      const choice = await installEvent.userChoice
      if (choice.outcome === 'accepted') setIsInstalled(true)
      setInstallEvent(null)
      return choice.outcome
    } catch {
      return 'error'
    }
  }, [installEvent])

  return { canInstall: installEvent !== null && !isInstalled, promptInstall, isInstalled, isIos }
}
