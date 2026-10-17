import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCardModel, buildResultFilename, buildShareText } from '../src/features/share/cardModel'
import { drawCard } from '../src/features/share/drawCard'
import { renderResultCard } from '../src/features/share/renderResultCard'
import {
  copyImage,
  downloadImage,
  shareImage,
  supportsFileShare,
  supportsImageClipboard,
} from '../src/features/share/shareActions'
import type { Preferences } from '../src/utils/storage'
import { makeResult, preferences } from './helpers'

function createDrawingContext() {
  let font = ''
  const textCalls: Array<{ text: string; x: number; y: number; font: string }> = []
  const context = {
    set font(value: string) { font = value },
    get font() { return font },
    measureText: vi.fn((text: string) => {
      const size = Number(font.match(/\d+/)?.[0] ?? 16)
      return { width: text.length * size * 0.6 } as TextMetrics
    }),
    fillText: vi.fn((text: string, x: number, y: number) => textCalls.push({ text, x, y, font })),
    fillRect: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    drawImage: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
  }
  return { context: context as unknown as CanvasRenderingContext2D, textCalls }
}

describe('share card model and copy', () => {
  it('keeps only aggregate stats and formats three-digit WPM and date', () => {
    const model = buildCardModel(makeResult({
      wpm: 123,
      rawWpm: 145,
      accuracy: 98.5,
      completedAt: '2025-04-05T12:00:00.000Z',
      wpmSamples: [12, 60, 80],
    }), 'example.test')
    expect(model).toMatchObject({
      wpm: 123,
      rawWpm: 145,
      accuracy: 98.5,
      modeLabel: '30s',
      dateLabel: 'Apr 5, 2025',
      siteUrl: 'example.test',
      punctuationEnabled: false,
      numbersEnabled: false,
      wpmSamples: [12, 60, 80],
    })
    expect(model).not.toHaveProperty('typed')
    expect(model).not.toHaveProperty('weakKeyStats')
  })

  it('preserves zero values and gracefully copies absent samples', () => {
    const model = buildCardModel(makeResult({ wpm: 0, rawWpm: 0, accuracy: 0, wpmSamples: [] }))
    expect(model).toMatchObject({ wpm: 0, rawWpm: 0, accuracy: 0, wpmSamples: [] })
  })

  it('copies the saved punctuation and number settings into the model', () => {
    const model = buildCardModel(makeResult({
      settings: { punctuation: true, numbers: true },
    }))
    expect(model).toMatchObject({ punctuationEnabled: true, numbersEnabled: true })
  })

  it.each([
    [{ ...preferences, mode: 'words' as const }, '10 words'],
    [{ ...preferences, mode: 'weak-keys' as const }, 'Weak keys · 10 words'],
    [{ ...preferences, mode: 'code' as const }, 'Code · code'],
  ])('labels each non-time mode', (prefs, expected) => {
    const result = makeResult({}, prefs as Preferences)
    expect(buildCardModel(result).modeLabel).toBe(expected)
  })

  it('uses the saved accuracy and supplied site URL in share text and filenames', () => {
    const result = makeResult({
      wpm: 72,
      accuracy: 98,
      completedAt: '2024-02-03T04:05:06.000Z',
    })
    expect(buildShareText(result, 'https://typeshyt.example')).toBe(
      'I typed 72 WPM at 98% accuracy on TypeShyt\nhttps://typeshyt.example',
    )
    expect(buildResultFilename(result)).toBe('typeshyt-72wpm-2024-02-03.png')
  })
})

describe('result card WPM headline layout', () => {
  it.each([
    ['landscape', 0],
    ['landscape', 123],
    ['portrait', 0],
    ['portrait', 123],
  ] as const)('separates the %s headline value %i from its label on one baseline', (format, wpm) => {
    const { context, textCalls } = createDrawingContext()
    const favicon = {} as CanvasImageSource
    drawCard(context, buildCardModel(makeResult({ wpm })), format, favicon)
    const value = textCalls.find((call) => call.text === String(wpm))
    const label = textCalls.find((call) => call.text === 'WPM')
    expect(value).toBeDefined()
    expect(label).toBeDefined()
    if (!value || !label) return

    const valueFontSize = Number(value.font.match(/\d+/)?.[0])
    const estimatedValueWidth = String(wpm).length * valueFontSize * 0.6
    expect(label.x).toBeGreaterThan(value.x + estimatedValueWidth)
    expect(label.y).toBe(value.y)
    expect(context.drawImage).toHaveBeenCalledWith(favicon, format === 'portrait' ? 72 : 76, format === 'portrait' ? 75 : 66, format === 'portrait' ? 58 : 52, format === 'portrait' ? 58 : 52)
  })
})

describe('share browser actions', () => {
  const blob = new Blob(['image'], { type: 'image/png' })
  const navigatorProperties = ['canShare', 'share', 'clipboard'] as const
  const originalNavigatorProperties = Object.fromEntries(
    navigatorProperties.map((property) => [property, Object.getOwnPropertyDescriptor(navigator, property)]),
  )
  const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
  const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')

  beforeEach(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    vi.stubGlobal('ClipboardItem', undefined)
  })

  afterEach(() => {
    for (const property of navigatorProperties) {
      const descriptor = originalNavigatorProperties[property]
      if (descriptor) Object.defineProperty(navigator, property, descriptor)
      else Reflect.deleteProperty(navigator, property)
    }
    for (const [property, descriptor] of [['createObjectURL', originalCreateObjectURL], ['revokeObjectURL', originalRevokeObjectURL]] as const) {
      if (descriptor) Object.defineProperty(URL, property, descriptor)
      else Reflect.deleteProperty(URL, property)
    }
    vi.unstubAllGlobals()
  })

  it('feature-detects unsupported native share and clipboard APIs', () => {
    expect(supportsFileShare()).toBe(false)
    expect(supportsImageClipboard()).toBe(false)
  })

  it('shares a file only when canShare accepts it and maps AbortError to cancellation', async () => {
    const canShare = vi.fn(() => true)
    const share = vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError'))
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: canShare })
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    expect(supportsFileShare()).toBe(true)
    await expect(shareImage(blob, 'test.png', 'summary')).resolves.toEqual({ ok: false, reason: 'cancelled' })
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'TypeShyt result', text: 'summary' }))
  })

  it('returns an unsupported result when native file sharing rejects the file', async () => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: vi.fn(() => false) })
    Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn() })
    await expect(shareImage(blob, 'test.png', 'summary')).resolves.toEqual({ ok: false, reason: 'unsupported' })
  })

  it('copies a PNG through ClipboardItem and maps failures', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    const clipboardItem = vi.fn()
    vi.stubGlobal('ClipboardItem', clipboardItem)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { write } })
    expect(supportsImageClipboard()).toBe(true)
    await expect(copyImage(blob)).resolves.toEqual({ ok: true })
    expect(clipboardItem).toHaveBeenCalledWith({ 'image/png': blob })
    write.mockRejectedValueOnce(new Error('denied'))
    await expect(copyImage(blob)).resolves.toEqual({ ok: false, reason: 'error' })
  })

  it('downloads by clicking a generated link and revokes its object URL', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const appendChild = document.body.appendChild.bind(document.body)
    const createdAnchors: HTMLAnchorElement[] = []
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement) createdAnchors.push(node)
      return appendChild(node)
    })
    const createObjectURL = vi.fn(() => 'blob:result')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })
    await expect(downloadImage(blob, 'test.png')).resolves.toEqual({ ok: true })
    expect(click).toHaveBeenCalledOnce()
    expect(createdAnchors[0]?.download).toBe('test.png')
    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:result')
    expect(document.body.contains(createdAnchors[0] ?? null)).toBe(false)
  })
})

describe('canvas image rendering', () => {
  const originalImage = globalThis.Image

  afterEach(() => {
    vi.stubGlobal('Image', originalImage)
  })

  it('calls the drawing function with the result model and exact output dimensions', async () => {
    const draw = vi.spyOn(await import('../src/features/share/drawCard'), 'drawCard').mockImplementation(() => {})
    const createElement = vi.spyOn(document, 'createElement')
    const favicon = { decode: vi.fn().mockResolvedValue(undefined), src: '' }
    vi.stubGlobal('Image', vi.fn(() => favicon))
    const canvasContext = {} as CanvasRenderingContext2D
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(new Blob(['png'], { type: 'image/png' }))
    })
    const result = makeResult({ wpm: 88 })

    const blob = await renderResultCard(result, { format: 'portrait' })

    expect(blob.type).toBe('image/png')
    expect(draw).toHaveBeenCalledWith(
      canvasContext,
      expect.objectContaining({ wpm: 88, modeLabel: '30s', siteUrl: window.location.host }),
      'portrait',
      favicon,
    )
    expect(favicon.src).toBe(new URL(`${import.meta.env.BASE_URL}favicon.svg`, window.location.href).href)
    const canvas = createElement.mock.results[0]?.value as HTMLCanvasElement | undefined
    expect(canvas).toMatchObject({ width: 1080, height: 1350 })
    draw.mockRestore()
  })

  it('rejects when canvas PNG export returns null', async () => {
    vi.spyOn(await import('../src/features/share/drawCard'), 'drawCard').mockImplementation(() => {})
    vi.stubGlobal('Image', vi.fn(() => ({ decode: vi.fn().mockResolvedValue(undefined) })))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(null))
    await expect(renderResultCard(makeResult(), { format: 'landscape' })).rejects.toThrow('empty image')
  })
})
