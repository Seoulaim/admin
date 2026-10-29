import { addDays, todayKey } from '../../lib/dates.js'
import { inputClass } from './inputClass.js'

// Quick ranges ending today (Seoul).
function presets() {
  const today = todayKey()
  return [
    { label: '오늘', from: today, to: today },
    { label: '7일', from: addDays(today, -6), to: today },
    { label: '30일', from: addDays(today, -29), to: today },
    { label: '이번 달', from: `${today.slice(0, 8)}01`, to: today },
    { label: '전체', from: '', to: '' },
  ]
}

// From ~ to date inputs with quick ranges. value: { from, to } ('' = open).
function DateRangeFilter({ value, onChange }) {
  const input = `${inputClass} h-9 max-w-[9.5rem] tabular-nums`

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        type="date"
        aria-label="시작일"
        value={value.from}
        max={value.to || undefined}
        onChange={(event) => onChange({ ...value, from: event.target.value })}
        className={input}
      />
      <span className="text-sub">~</span>
      <input
        type="date"
        aria-label="종료일"
        value={value.to}
        min={value.from || undefined}
        onChange={(event) => onChange({ ...value, to: event.target.value })}
        className={input}
      />
      {presets().map((p) => {
        const active = p.from === value.from && p.to === value.to
        return (
          <button
            key={p.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange({ from: p.from, to: p.to })}
            className={`h-7 rounded-full px-2.5 text-xs font-semibold ${active ? 'bg-text text-white' : 'text-muted hover:bg-chip'}`}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

export default DateRangeFilter
