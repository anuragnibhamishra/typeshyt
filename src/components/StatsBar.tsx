interface Props {
  timeValue: string | number
  timeLabel: string
  netWpm: number
  rawWpm: number
  accuracy: number
  correctKeystrokes: number
  totalKeystrokes: number
}

function Stat({ label, value, detail, accent = false }: { label: string; value: string | number; detail?: string; accent?: boolean }) {
  return (
    <div>
      <div className={`font-mono text-3xl font-bold tabular-nums sm:text-4xl ${accent ? 'text-brand-400' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-xs text-slate-400 sm:text-sm">{label}</div>
      {detail && <div className="mt-0.5 text-xs text-slate-400">{detail}</div>}
    </div>
  )
}

export default function StatsBar({
  timeValue,
  timeLabel,
  netWpm,
  rawWpm,
  accuracy,
  correctKeystrokes,
  totalKeystrokes,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 sm:gap-6" aria-live="off">
      <Stat label={timeLabel} value={timeValue} accent />
      <Stat label="Net WPM" value={netWpm} />
      <Stat label="Raw WPM" value={rawWpm} />
      <Stat
        label="Accuracy"
        value={`${accuracy}%`}
        detail={`${correctKeystrokes} / ${totalKeystrokes} keystrokes correct`}
      />
    </div>
  )
}
