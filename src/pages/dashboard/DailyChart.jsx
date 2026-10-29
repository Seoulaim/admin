import { useState } from 'react'
import Card from '../../components/Card.jsx'
import { formatMonthDay } from '../../lib/dates.js'

const METRICS = [
  { key: 'signups', label: '신규 가입자', unit: '명' },
  { key: 'payments', label: '결제 건수', unit: '건' },
]

// Rounds the top of the scale up to a clean number with an even half.
function niceMax(value) {
  const step = value <= 10 ? 2 : value <= 50 ? 10 : 50
  return Math.max(step, Math.ceil(value / step) * step)
}

// Last 14 days as columns, one metric at a time (one scale per chart).
// Hover or focus a column for its value; the busiest day is labeled.
function DailyChart({ daily }) {
  const [metricKey, setMetricKey] = useState(METRICS[0].key)
  const metric = METRICS.find((m) => m.key === metricKey)
  const values = daily.map((day) => day[metric.key])
  const max = niceMax(Math.max(...values))
  const peak = values.indexOf(Math.max(...values))
  const ticks = [max, max / 2, 0]

  return (
    <Card className="p-5 lg:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold">
          최근 14일 {metric.label}
          <span className="ml-2 text-sm font-medium text-sub tabular-nums">
            합계 {values.reduce((sum, n) => sum + n, 0)}
            {metric.unit}
          </span>
        </h2>
        <div
          role="tablist"
          className="flex rounded-full bg-chip p-1 text-sm font-semibold"
        >
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={m.key === metricKey}
              onClick={() => setMetricKey(m.key)}
              className={`rounded-full px-3 py-1 ${m.key === metricKey ? 'bg-white text-text shadow-card' : 'text-sub'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex h-48 flex-col justify-between pb-6 text-right text-xs text-sub tabular-nums">
          {ticks.map((tick) => (
            <span key={tick} className="-translate-y-1/2 leading-none">
              {tick}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
            {ticks.map((tick) => (
              <div key={tick} className="h-px bg-border" />
            ))}
          </div>
          <ol className="relative flex h-48">
            {daily.map((day, i) => (
              <li
                key={day.date}
                tabIndex={0}
                aria-label={`${formatMonthDay(day.date)} ${values[i]}${metric.unit}`}
                className="group relative flex flex-1 flex-col items-center outline-none"
              >
                <div className="relative flex w-full flex-1 items-end justify-center">
                  {i === peak && (
                    <span
                      className="absolute text-xs font-semibold text-muted tabular-nums"
                      style={{
                        bottom: `calc(${(values[i] / max) * 100}% + 4px)`,
                      }}
                    >
                      {values[i]}
                    </span>
                  )}
                  <div
                    className="w-[60%] max-w-6 rounded-t bg-point-strong transition-opacity group-hover:opacity-80"
                    style={{ height: `${(values[i] / max) * 100}%` }}
                  />
                  <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-lg bg-text px-2.5 py-1.5 text-xs whitespace-nowrap text-white group-hover:block group-focus:block">
                    {formatMonthDay(day.date)} · {values[i]}
                    {metric.unit}
                  </div>
                </div>
                <span
                  className={`h-6 pt-1.5 text-[11px] text-sub tabular-nums ${i % 2 === daily.length % 2 ? 'max-sm:invisible' : ''}`}
                >
                  {formatMonthDay(day.date)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  )
}

export default DailyChart
