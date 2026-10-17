import { averageWpm, peakWpm } from '../utils/stats'

interface Props {
  samples: number[]
}

const WIDTH = 640
const HEIGHT = 240
const PADDING = { top: 20, right: 18, bottom: 42, left: 48 }

export default function WpmChart({ samples }: Props) {
  const average = averageWpm(samples)
  const peak = peakWpm(samples)

  if (samples.length < 2) {
    return (
      <div className="rounded-lg bg-slate-950/50 p-5 text-sm text-slate-400">
        WPM chart needs at least two one-second samples. This short test has {samples.length}.
      </div>
    )
  }

  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom
  const maxWpm = Math.max(10, Math.ceil(peak / 10) * 10)
  const points = samples.map((wpm, index) => {
    const x = PADDING.left + (index / (samples.length - 1)) * plotWidth
    const y = PADDING.top + plotHeight - (wpm / maxWpm) * plotHeight
    return `${x},${y}`
  })
  const yTicks = [0, Math.round(maxWpm / 2), maxWpm]

  return (
    <figure className="min-w-0 rounded-lg bg-slate-950/50 p-3 sm:p-4">
      <p className="sr-only" aria-live="polite">Average {average}, peak {peak} WPM over {samples.length} seconds.</p>
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Net WPM by second. Average ${average}, peak ${peak} WPM.`}
          className="h-auto w-full"
        >
          {yTicks.map((tick) => {
            const y = PADDING.top + plotHeight - (tick / maxWpm) * plotHeight
            return (
              <g key={tick}>
                <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} stroke="#334155" strokeDasharray="4 5" />
                <text x={PADDING.left - 9} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="12">{tick}</text>
              </g>
            )
          })}
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke="#34d399"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((point, index) => {
            const [x, y] = point.split(',').map(Number)
            return <circle key={index} cx={x} cy={y} r="3.5" fill="#34d399" />
          })}
          <line
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={HEIGHT - PADDING.bottom}
            y2={HEIGHT - PADDING.bottom}
            stroke="#64748b"
          />
          <text x={PADDING.left + plotWidth / 2} y={HEIGHT - 9} textAnchor="middle" fill="#cbd5e1" fontSize="13">
            Elapsed time (seconds)
          </text>
          <text
            x="14"
            y={PADDING.top + plotHeight / 2}
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize="13"
            transform={`rotate(-90 14 ${PADDING.top + plotHeight / 2})`}
          >
            Net WPM
          </text>
          <text x={PADDING.left} y={HEIGHT - PADDING.bottom + 19} fill="#94a3b8" fontSize="11">1</text>
          <text x={WIDTH - PADDING.right} y={HEIGHT - PADDING.bottom + 19} textAnchor="end" fill="#94a3b8" fontSize="11">
            {samples.length}
          </text>
        </svg>
      </div>
    </figure>
  )
}
