import {
  daysBetween,
  formatMonthDay,
  formatShortDate,
  fromDateKey,
  todayKey,
  WEEKDAYS,
} from './dates.js'
import { isHttpUrl } from './validate.js'

export const MAX_PHOTOS = 5
export const MAX_VIDEOS = 5

// Place photos in the member app's plan list and detail (668×324 slides).
export const PLACE_PHOTO = { width: 668, height: 324 }

export const DAYS = [
  { id: 'mon', label: '월' },
  { id: 'tue', label: '화' },
  { id: 'wed', label: '수' },
  { id: 'thu', label: '목' },
  { id: 'fri', label: '금' },
  { id: 'sat', label: '토' },
  { id: 'sun', label: '일' },
]

export const DEFAULT_DAY = { open: '10:00', close: '22:00', breaks: [] }

export const everyDay = (day) =>
  Object.fromEntries(DAYS.map((d) => [d.id, structuredClone(day)]))

// "10:00–22:00 (브레이크 15:00–17:00)" for one day, or "휴무".
export function formatDay(day) {
  if (!day) return '휴무'
  const breaks = day.breaks.map((b) => `${b.start}–${b.end}`).join(', ')
  return `${day.open}–${day.close}${breaks ? ` (브레이크 ${breaks})` : ''}`
}

// A short line for the list: "매일 10:00–22:00", "월 휴무 · …", "영업시간 없음".
export function hoursSummary(hours) {
  if (!hours) return '영업시간 없음'
  const lines = DAYS.map((d) => formatDay(hours[d.id]))
  if (lines.every((line) => line === lines[0])) return `매일 ${lines[0]}`
  const closed = DAYS.filter((d) => !hours[d.id]).map((d) => d.label)
  return closed.length > 0 ? `${closed.join('·')} 휴무` : '요일별로 다름'
}

// Problems in the week's hours, or null. Breaks must sit inside the day.
export function hoursError(hours) {
  if (!hours) return null
  for (const { id, label } of DAYS) {
    const day = hours[id]
    if (!day) continue
    if (!day.open || !day.close) return `${label}요일 시간을 입력해 주세요.`
    if (day.open === day.close)
      return `${label}요일 여는 시간과 닫는 시간이 같아요.`
    for (const b of day.breaks) {
      if (!b.start || !b.end || b.end <= b.start) {
        return `${label}요일 브레이크타임을 확인해 주세요.`
      }
    }
  }
  return null
}

export function videoUrlsError(urls) {
  return urls.some((url) => !isHttpUrl(url))
    ? 'https://로 시작하는 주소를 입력해 주세요.'
    : null
}

// YouTube video id from a watch / youtu.be / shorts link, for a thumbnail.
export function youTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/,
  )
  return match?.[1] ?? null
}

// ---------- 운영 일정 ----------
// operating: { always: true } | { always: false, startDate, endDate }
// ('YYYY-MM-DD', 시작일·종료일 당일 포함).

export const ALWAYS_OPEN = { always: true, startDate: '', endDate: '' }

export function operatingError(operating) {
  if (operating.always) return null
  if (!operating.startDate || !operating.endDate)
    return '시작일과 종료일을 입력해 주세요.'
  if (operating.endDate < operating.startDate)
    return '종료일은 시작일과 같거나 뒤여야 해요.'
  return null
}

// 오늘(한국) 기준 운영 상태. 기간이 없거나 틀리면 null.
// → { state: 'upcoming' | 'open' | 'ended', daysLeft, totalDays }
export function operatingStatus(operating, today = todayKey()) {
  if (operating.always || operatingError(operating)) return null
  const { startDate, endDate } = operating
  const totalDays = daysBetween(startDate, endDate) + 1
  if (today < startDate)
    return {
      state: 'upcoming',
      daysLeft: daysBetween(today, startDate),
      totalDays,
    }
  if (today <= endDate)
    return { state: 'open', daysLeft: daysBetween(today, endDate), totalDays }
  return { state: 'ended', daysLeft: 0, totalDays }
}

// "26.11.09 (월)"
export const formatDateWithWeekday = (key) =>
  `${formatShortDate(key)} (${WEEKDAYS[fromDateKey(key).getDay()]})`

// 목록용 "26.11.09~11.18" (해가 바뀌면 끝도 yy.mm.dd). 상시면 null.
export function operatingShort(operating) {
  if (operating.always || operatingError(operating)) return null
  const { startDate, endDate } = operating
  const end =
    startDate.slice(0, 4) === endDate.slice(0, 4)
      ? formatMonthDay(endDate)
      : formatShortDate(endDate)
  return `${formatShortDate(startDate)}~${end}`
}
