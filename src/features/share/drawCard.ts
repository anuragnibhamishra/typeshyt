import type { CardFormat, CardModel } from './cardModel'

const COLORS = {
  background: '#020617',
  white: '#f8fafc',
  muted: '#cbd5e1',
  emerald: '#6ee7b7',
  emeraldDark: '#34d399',
  border: '#334155',
}

const SIZES: Record<CardFormat, { width: number; height: number }> = {
  landscape: { width: 1200, height: 630 },
  portrait: { width: 1080, height: 1350 },
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  family = '"JetBrains Mono", ui-monospace, monospace',
  weight = 700,
): { font: string; text: string } {
  let size = fontSize
  ctx.font = `${weight} ${size}px ${family}`
  while (ctx.measureText(text).width > maxWidth && size > 16) {
    size -= 2
    ctx.font = `${weight} ${size}px ${family}`
  }
  let fitted = text
  while (ctx.measureText(fitted).width > maxWidth && fitted.length > 1) {
    fitted = `${fitted.slice(0, -2)}…`
  }
  return { font: ctx.font, text: fitted }
}

function drawWordmark(ctx: CanvasRenderingContext2D, x: number, y: number, fontSize: number) {
  ctx.font = `700 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`
  ctx.textAlign = 'left'
  ctx.fillStyle = COLORS.white
  ctx.fillText('Type', x, y)
  const typeWidth = ctx.measureText('Type').width
  ctx.fillStyle = COLORS.emerald
  ctx.fillText('Shyt', x + typeWidth, y)
}

function drawWpmHeadline(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  baseline: number,
  maxWidth: number,
  fontSize: number,
  labelSize: number,
) {
  const family = '"JetBrains Mono", ui-monospace, monospace'
  const labelGap = Math.max(18, fontSize * 0.12)
  let valueSize = fontSize
  const labelFont = `700 ${labelSize}px ${family}`
  ctx.font = labelFont
  const labelWidth = ctx.measureText('WPM').width

  ctx.font = `700 ${valueSize}px ${family}`
  let valueWidth = ctx.measureText(value).width
  while (valueSize > 16 && valueWidth + labelGap + labelWidth > maxWidth) {
    valueSize -= 2
    ctx.font = `700 ${valueSize}px ${family}`
    valueWidth = ctx.measureText(value).width
  }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = COLORS.emerald
  ctx.fillText(value, x, baseline)
  ctx.font = labelFont
  ctx.fillText('WPM', x + valueWidth + labelGap, baseline)
}

function drawLineChart(ctx: CanvasRenderingContext2D, samples: number[], x: number, y: number, width: number, height: number) {
  if (samples.length < 3) return
  const points = samples.map((value, index) => ({
    x: x + (index / (samples.length - 1)) * width,
    y: y + height - (value / Math.max(1, ...samples)) * height,
  }))
  ctx.strokeStyle = COLORS.emeraldDark
  ctx.lineWidth = 4
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y)
    else ctx.lineTo(point.x, point.y)
  })
  ctx.stroke()
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, width, height)
  const glow = ctx.createRadialGradient(width * 0.5, 0, 0, width * 0.5, 0, width * 0.8)
  glow.addColorStop(0, 'rgba(16, 185, 129, 0.26)')
  glow.addColorStop(1, 'rgba(2, 6, 23, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)
}

function drawLabelValue(ctx: CanvasRenderingContext2D, label: string, value: string, x: number, y: number, width: number) {
  ctx.textAlign = 'left'
  ctx.fillStyle = COLORS.muted
  ctx.font = '500 20px Manrope, ui-sans-serif, sans-serif'
  ctx.fillText(label, x, y)
  ctx.fillStyle = COLORS.white
  const fitted = fitText(ctx, value, width, 26, 'Manrope, ui-sans-serif, sans-serif', 500)
  ctx.font = fitted.font
  ctx.fillText(fitted.text, x, y + 39)
}

function drawFooterUrl(ctx: CanvasRenderingContext2D, url: string, x: number, y: number, width: number, fontSize: number) {
  ctx.fillStyle = COLORS.muted
  const fitted = fitText(ctx, url, width, fontSize, 'Manrope, ui-sans-serif, sans-serif', 500)
  ctx.font = fitted.font
  ctx.fillText(fitted.text, x, y)
}

export function drawCard(
  ctx: CanvasRenderingContext2D,
  model: CardModel,
  format: CardFormat,
  favicon: CanvasImageSource,
): void {
  const { width, height } = SIZES[format]
  drawBackground(ctx, width, height)

  const portrait = format === 'portrait'
  const pad = portrait ? 72 : 76
  const logoSize = portrait ? 58 : 52
  ctx.drawImage(favicon, pad, portrait ? 75 : 66, logoSize, logoSize)
  drawWordmark(ctx, pad + logoSize + 18, portrait ? 119 : 107, portrait ? 36 : 32)

  if (!portrait) {
    ctx.fillStyle = COLORS.muted
    ctx.font = '500 24px Manrope, ui-sans-serif, sans-serif'
    ctx.fillText('NET WPM', pad, 205)
    drawWpmHeadline(ctx, String(model.wpm), pad - 8, 370, 590, 176, 34)

    const statsX = 700
    const statWidth = 210
    drawLabelValue(ctx, 'ACCURACY', `${model.accuracy}%`, statsX, 220, statWidth)
    drawLabelValue(ctx, 'RAW WPM', String(model.rawWpm), statsX + 250, 220, 170)
    drawLabelValue(ctx, 'MODE', model.modeLabel, statsX, 340, 460)
    drawLabelValue(ctx, 'DATE', model.dateLabel, statsX + 250, 340, 210)
    drawLineChart(ctx, model.wpmSamples, 720, 445, 390, 72)
    drawFooterUrl(
      ctx,
      `Punctuation ${model.punctuationEnabled ? 'on' : 'off'} · Numbers ${model.numbersEnabled ? 'on' : 'off'}`,
      pad,
      510,
      width - pad * 2,
      18,
    )
    ctx.strokeStyle = COLORS.border
    ctx.beginPath()
    ctx.moveTo(pad, 552)
    ctx.lineTo(width - pad, 552)
    ctx.stroke()
    drawFooterUrl(ctx, model.siteUrl, pad, 590, width - pad * 2, 18)
    return
  }

  ctx.fillStyle = COLORS.muted
  ctx.font = '500 26px Manrope, ui-sans-serif, sans-serif'
  ctx.fillText('NET WPM', pad, 270)
  drawWpmHeadline(ctx, String(model.wpm), pad - 10, 535, width - pad * 2, 240, 42)

  ctx.strokeStyle = COLORS.border
  ctx.beginPath()
  ctx.moveTo(pad, 600)
  ctx.lineTo(width - pad, 600)
  ctx.stroke()
  drawLabelValue(ctx, 'ACCURACY', `${model.accuracy}%`, pad, 675, 390)
  drawLabelValue(ctx, 'RAW WPM', String(model.rawWpm), width / 2 + 20, 675, 390)
  drawLabelValue(ctx, 'MODE', model.modeLabel, pad, 800, width - pad * 2)
  drawLabelValue(ctx, 'DATE', model.dateLabel, width / 2 + 20, 800, 390)
  drawFooterUrl(
    ctx,
    `Punctuation ${model.punctuationEnabled ? 'on' : 'off'} · Numbers ${model.numbersEnabled ? 'on' : 'off'}`,
    pad,
    950,
    width - pad * 2,
    20,
  )
  drawLineChart(ctx, model.wpmSamples, pad, 1030, width - pad * 2, 100)
  ctx.strokeStyle = COLORS.border
  ctx.beginPath()
  ctx.moveTo(pad, 1200)
  ctx.lineTo(width - pad, 1200)
  ctx.stroke()
  drawFooterUrl(ctx, model.siteUrl, pad, 1250, width - pad * 2, 20)
}
