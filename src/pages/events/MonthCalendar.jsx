import {
  formatMonthDay,
  fullMonthGrid,
  todayKey,
  WEEKDAYS,
} from '../../lib/dates.js'
import { pickText, tagClass } from '../../lib/events.js'

const MAX_TAGS = 3
const WEEKDAY_COLORS = { 0: 'text-red-500', 6: 'text-blue-500' }

// The fan calendar month: each day shows its tags like the member app.
// month: { year, month (0–11) }; days: calendarDays(); clicking a day
// selects it.
function MonthCalendar({ month, days, selected, onSelect }) {
  const today = todayKey()
  const weeks = fullMonthGrid(month.year, month.month)
  const monthPrefix = `${month.year}-${String(month.month + 1).padStart(2, '0')}`

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-panel">
        {WEEKDAYS.map((name, i) => (
          <div
            key={name}
            className={`py-2 text-center text-xs font-semibold ${WEEKDAY_COLORS[i] ?? 'text-muted'}`}
          >
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((date, i) => {
          const items = days[date] ?? []
          const outside = !date.startsWith(monthPrefix)
          const isSelected = date === selected
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              aria-pressed={isSelected}
              aria-label={`${formatMonthDay(date)} 일정 ${items.length}개`}
              className={`flex min-h-[92px] flex-col gap-1 border-border p-1.5 text-left lg:min-h-[104px] ${i % 7 ? 'border-l' : ''} ${i >= 7 ? 'border-t' : ''} ${isSelected ? 'bg-point-soft/60 ring-2 ring-point ring-inset' : 'hover:bg-chip/60'}`}
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${date === today ? 'bg-point-strong text-white' : outside ? 'text-line' : (WEEKDAY_COLORS[i % 7] ?? 'text-text')}`}
              >
                {Number(date.slice(8))}
              </span>
              {items.slice(0, MAX_TAGS).map((entry) => (
                <span
                  key={entry.id}
                  className={`truncate rounded-[3px] px-1 py-px text-[11px] leading-[15px] text-text ${tagClass(entry.color)} ${outside ? 'opacity-50' : ''}`}
                >
                  {pickText(entry.title)}
                </span>
              ))}
              {items.length > MAX_TAGS && (
                <span className="px-1 text-[11px] text-sub">
                  +{items.length - MAX_TAGS}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MonthCalendar
