import { useCallback, useEffect, useRef, useState } from 'react'

export function usePwaUpdates() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const applyRequestedRef = useRef(false)
  const [updateReady, setUpdateReady] = useState(false)
  const [registrationError, setRegistrationError] = useState(false)

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

    const onControllerChange = () => {
      if (applyRequestedRef.current) window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        registrationRef.current = registration
        if (registration.waiting && navigator.serviceWorker.controller) setUpdateReady(true)

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateReady(true)
            }
          })
        })
      })
      .catch((error: unknown) => {
        console.error('Service worker registration failed', error)
        setRegistrationError(true)
      })

    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
  }, [])

  const applyUpdate = useCallback(() => {
    const waiting = registrationRef.current?.waiting
    if (!waiting) {
      setRegistrationError(true)
      return
    }
    applyRequestedRef.current = true
    waiting.postMessage({ type: 'SKIP_WAITING' })
  }, [])

  const dismissUpdate = useCallback(() => setUpdateReady(false), [])

  return { updateReady, registrationError, applyUpdate, dismissUpdate }
}
