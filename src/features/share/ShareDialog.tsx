import { useEffect, useId, useRef, useState, type MutableRefObject } from 'react'
import type { TestResult } from '../../utils/storage'
import { buildResultFilename, buildShareText, type CardFormat } from './cardModel'
import { copyImage, downloadImage, shareImage, supportsFileShare, supportsImageClipboard } from './shareActions'
import { renderResultCard } from './renderResultCard'

interface Props {
  result: TestResult
  triggerRef: MutableRefObject<HTMLButtonElement | null>
  onClose: () => void
}

type RenderState = 'loading' | 'ready' | 'error'

export default function ShareDialog({ result, triggerRef, onClose }: Props) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [format, setFormat] = useState<CardFormat>('landscape')
  const [renderState, setRenderState] = useState<RenderState>('loading')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [fileSharingAvailable, setFileSharingAvailable] = useState(false)
  const [clipboardAvailable, setClipboardAvailable] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setFileSharingAvailable(supportsFileShare())
    setClipboardAvailable(supportsImageClipboard())
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    const trigger = triggerRef.current
    const initialFocus = dialog?.querySelector<HTMLElement>('[data-dialog-initial-focus]')
    initialFocus?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])'),
      )
      if (focusable.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      trigger?.focus()
    }
  }, [onClose, triggerRef])

  useEffect(() => {
    let cancelled = false
    let createdUrl: string | null = null
    setRenderState('loading')
    setImageUrl(null)
    setImageBlob(null)
    setMessage('')

    renderResultCard(result, { format })
      .then((blob) => {
        if (cancelled) return
        createdUrl = URL.createObjectURL(blob)
        setImageBlob(blob)
        setImageUrl(createdUrl)
        setRenderState('ready')
      })
      .catch(() => {
        if (!cancelled) setRenderState('error')
      })

    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [format, result])

  const act = async (action: 'download' | 'share' | 'copy') => {
    if (!imageBlob) return
    const filename = buildResultFilename(result)
    const response = action === 'download'
      ? await downloadImage(imageBlob, filename)
      : action === 'copy'
        ? await copyImage(imageBlob)
        : await shareImage(imageBlob, filename, buildShareText(result, window.location.origin))

    if (response.ok) {
      setMessage(action === 'download' ? 'Image downloaded' : action === 'copy' ? 'Copied to clipboard' : 'Share sheet opened')
    } else if (response.reason !== 'cancelled') {
      setMessage(response.reason === 'unsupported' ? 'This action is not supported by your browser.' : 'The image action failed. Please try again.')
    }
  }

  const alt = `TypeShyt result card: ${result.wpm} Net WPM, ${result.rawWpm} Raw WPM, ${result.accuracy}% accuracy, ${result.mode === 'time' ? `${result.duration} second test` : result.variant === 'code' ? `Code ${result.language}` : `${result.wordCount} words`}.`

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-3 sm:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold text-white">Share result</h2>
          <button
            type="button"
            data-dialog-initial-focus
            onClick={onClose}
            aria-label="Close share dialog"
            className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium text-slate-300">Image format</legend>
          <div className="flex flex-wrap gap-2">
            {(['landscape', 'portrait'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={format === option}
                onClick={() => setFormat(option)}
                className={`rounded-md px-3 py-2 text-sm capitalize ${
                  format === option ? 'bg-brand-500 font-semibold text-slate-950' : 'border border-slate-600 text-slate-200 hover:bg-slate-800'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 grid min-h-40 place-items-center overflow-hidden rounded-lg border border-slate-700 bg-slate-950 p-2">
          {renderState === 'loading' && <p role="status" className="text-sm text-slate-300">Preparing your image…</p>}
          {renderState === 'error' && (
            <p role="alert" className="text-sm text-red-300">The result image could not be rendered. Close the dialog and try again.</p>
          )}
          {renderState === 'ready' && imageUrl && (
            <img src={imageUrl} alt={alt} className="max-h-[45vh] max-w-full object-contain" />
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {fileSharingAvailable && (
            <button type="button" disabled={!imageBlob} onClick={() => void act('share')} className="rounded-md bg-brand-500 px-4 py-2 font-semibold text-slate-950 hover:bg-brand-400 disabled:opacity-50">
              Share
            </button>
          )}
          <button type="button" disabled={!imageBlob} onClick={() => void act('download')} className="rounded-md bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600 disabled:opacity-50">
            Download PNG
          </button>
          {clipboardAvailable && (
            <button type="button" disabled={!imageBlob} onClick={() => void act('copy')} className="rounded-md bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600 disabled:opacity-50">
              Copy image
            </button>
          )}
        </div>
        <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-brand-200">{message}</p>
      </div>
    </div>
  )
}
