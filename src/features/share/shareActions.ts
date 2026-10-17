export type ShareActionResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'cancelled' | 'error' }

function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
}

export function supportsFileShare(): boolean {
  try {
    if (typeof File !== 'function' || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false
    const file = new File([''], 'result.png', { type: 'image/png' })
    return navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

export function supportsImageClipboard(): boolean {
  try {
    return typeof navigator.clipboard?.write === 'function' && typeof ClipboardItem !== 'undefined'
  } catch {
    return false
  }
}

export async function downloadImage(blob: Blob, filename: string): Promise<ShareActionResult> {
  let url: string | null = null
  let anchor: HTMLAnchorElement | null = null
  let result: ShareActionResult
  try {
    if (
      typeof URL.createObjectURL !== 'function' ||
      typeof document.createElement !== 'function' ||
      !document.body
    ) {
      return { ok: false, reason: 'unsupported' }
    }
    url = URL.createObjectURL(blob)
    anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    anchor = null
    result = { ok: true }
  } catch {
    try {
      anchor?.remove()
    } catch {
      result = { ok: false, reason: 'error' }
    }
    result = { ok: false, reason: 'error' }
  }
  if (url) {
    try {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0))
      URL.revokeObjectURL(url)
    } catch {
      return { ok: false, reason: 'error' }
    }
  }
  return result
}

export async function shareImage(blob: Blob, filename: string, text: string): Promise<ShareActionResult> {
  try {
    if (typeof File !== 'function' || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
      return { ok: false, reason: 'unsupported' }
    }
    const file = new File([blob], filename, { type: 'image/png' })
    if (!navigator.canShare({ files: [file] })) return { ok: false, reason: 'unsupported' }
    await navigator.share({ files: [file], title: 'TypeShyt result', text })
    return { ok: true }
  } catch (error) {
    if (isAbortError(error)) return { ok: false, reason: 'cancelled' }
    return { ok: false, reason: 'error' }
  }
}

export async function copyImage(blob: Blob): Promise<ShareActionResult> {
  try {
    if (!supportsImageClipboard()) return { ok: false, reason: 'unsupported' }
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return { ok: true }
  } catch {
    return { ok: false, reason: 'error' }
  }
}
