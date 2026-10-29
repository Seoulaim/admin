import { DAYS, DEFAULT_DAY, everyDay } from '../../lib/places.js'
import Button from '../Button.jsx'
import { inputClass } from './inputClass.js'

const timeClass = `${inputClass} h-9 w-[7.5rem] tabular-nums`

function TimeRange({ start, end, onChange, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <input
        type="time"
        aria-label={`${label} 시작`}
        value={start}
        onChange={(event) => onChange(event.target.value, end)}
        className={timeClass}
      />
      <span className="text-sub">~</span>
      <input
        type="time"
        aria-label={`${label} 끝`}
        value={end}
        onChange={(event) => onChange(start, event.target.value)}
        className={timeClass}
      />
    </span>
  )
}

// Opening hours per weekday (Seoul time): open ~ close, any number of
// breaks, or closed. value null: the place has no opening hours.
function HoursInput({ value, onChange, invalid = false }) {
  const setDay = (id, day) => onChange({ ...value, [id]: day })

  return (
    <div className="flex flex-col gap-3">
      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={value === null}
          onChange={(event) =>
            onChange(event.target.checked ? null : everyDay(DEFAULT_DAY))
          }
          className="size-4 accent-point-strong"
        />
        영업시간 없음 (공원, 거리처럼 언제든 갈 수 있는 곳)
      </label>

      {value && (
        <div
          className={`divide-y divide-border rounded-xl border ${invalid ? 'border-danger' : 'border-border'}`}
        >
          {DAYS.map(({ id, label }, index) => {
            const day = value[id]
            return (
              <div
                key={id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5"
              >
                <span
                  className={`w-5 text-sm font-bold ${id === 'sun' ? 'text-red-500' : id === 'sat' ? 'text-blue-500' : ''}`}
                >
                  {label}
                </span>
                <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={!day}
                    onChange={(event) =>
                      setDay(
                        id,
                        event.target.checked ? null : { ...DEFAULT_DAY },
                      )
                    }
                    className="size-4 accent-point-strong"
                  />
                  휴무
                </label>
                {day && (
                  <>
                    <TimeRange
                      label={`${label}요일 영업`}
                      start={day.open}
                      end={day.close}
                      onChange={(open, close) =>
                        setDay(id, { ...day, open, close })
                      }
                    />
                    {day.breaks.map((b, i) => (
                      <span key={i} className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-sub">
                          브레이크
                        </span>
                        <TimeRange
                          label={`${label}요일 브레이크`}
                          start={b.start}
                          end={b.end}
                          onChange={(start, end) =>
                            setDay(id, {
                              ...day,
                              breaks: day.breaks.map((x, j) =>
                                j === i ? { start, end } : x,
                              ),
                            })
                          }
                        />
                        <button
                          type="button"
                          aria-label="브레이크 빼기"
                          onClick={() =>
                            setDay(id, {
                              ...day,
                              breaks: day.breaks.filter((_, j) => j !== i),
                            })
                          }
                          className="px-1 text-sub hover:text-danger"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setDay(id, {
                          ...day,
                          breaks: [
                            ...day.breaks,
                            { start: '15:00', end: '17:00' },
                          ],
                        })
                      }
                      className="text-xs font-semibold text-muted hover:text-text"
                    >
                      + 브레이크
                    </button>
                  </>
                )}
                {index === 0 && (
                  <Button
                    size="sm"
                    className="ml-auto"
                    onClick={() => onChange(everyDay(day))}
                  >
                    모든 요일에 복사
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default HoursInput
