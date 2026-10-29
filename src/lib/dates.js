// Dates come as 'YYYY-MM-DD' keys (or ISO 8601 when a time is needed) and are
// shown as yy.mm.dd, like the member app.

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Today in Seoul: posting periods and refunds follow Korean time wherever
// the admin is.
const seoulDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })

export function todayKey() {
  return seoulDate.format(new Date())
}

// yy.mm.dd
export function formatShortDate(key) {
  const [y, m, d] = key.slice(0, 10).split('-')
  return `${y.slice(2)}.${m}.${d}`
}

// mm.dd — where the year is not shown.
export function formatMonthDay(key) {
  const [, m, d] = key.slice(0, 10).split('-')
  return `${m}.${d}`
}

export function addDays(key, days) {
  const date = fromDateKey(key)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

export function daysBetween(startKey, endKey) {
  return Math.round((fromDateKey(endKey) - fromDateKey(startKey)) / MS_PER_DAY)
}

// "방금 전", "3시간 전", "2일 전", then yy.mm.dd after a week.
export function formatTimeAgo(iso, now = new Date()) {
  const minutes = Math.floor((now - new Date(iso)) / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return formatShortDate(toDateKey(new Date(iso)))
}

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// Weeks of the month starting on Sunday, padded with the neighboring
// months' days (same as the member app's fan calendar).
export function fullMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weekCount = Math.ceil((first.getDay() + daysInMonth) / 7)
  const date = new Date(year, month, 1 - first.getDay())
  const weeks = []
  for (let w = 0; w < weekCount; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      week.push(toDateKey(date))
      date.setDate(date.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

// "10월 29일 (목)"
export function formatLongDate(key) {
  const date = fromDateKey(key)
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`
}
