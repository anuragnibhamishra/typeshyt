import type { TestResult } from '../../utils/storage'
import { buildCardModel, type CardFormat } from './cardModel'
import { drawCard } from './drawCard'

export interface RenderOptions {
  format: CardFormat
}

const DIMENSIONS: Record<CardFormat, { width: number; height: number }> = {
  landscape: { width: 1200, height: 630 },
  portrait: { width: 1080, height: 1350 },
}

async function loadFavicon(): Promise<HTMLImageElement> {
  const favicon = new Image()
  const url = new URL(`${import.meta.env.BASE_URL}favicon.svg`, window.location.href).href
  if (typeof favicon.decode === 'function') {
    favicon.src = url
    await favicon.decode()
  } else {
    await new Promise<void>((resolve, reject) => {
      favicon.onload = () => resolve()
      favicon.onerror = () => reject(new Error('Could not load the TypeShyt favicon'))
      favicon.src = url
    })
  }
  return favicon
}

export async function renderResultCard(result: TestResult, options: RenderOptions): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const { width, height } = DIMENSIONS[options.format]
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context is unavailable')

  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('700 32px "JetBrains Mono"'),
        document.fonts.load('500 20px Manrope'),
        document.fonts.ready,
      ])
    } catch {
      // Canvas falls back to the monospace and sans-serif stacks if font loading fails.
    }
  }

  const favicon = await loadFavicon()
  drawCard(context, buildCardModel(result, window.location.host), options.format, favicon)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('PNG export returned an empty image'))
    }, 'image/png')
  })
}
