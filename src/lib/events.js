import { todayKey } from './dates.js'

// groupIds ['all']: shown to everyone. Otherwise the groups it's about —
// members see what's about their biases' groups (see api/events.js).
export const ALL_GROUPS = 'all'

// Fan calendar tag colors, as the member app draws them (FanCalendar.jsx).
export const TAG_COLORS = [
  { id: 'pink', label: '핑크', className: 'bg-point-soft' },
  { id: 'purple', label: '보라', className: 'bg-[#f0e9ff]' },
  { id: 'blue', label: '파랑', className: 'bg-[#dbf0ff]' },
  { id: 'orange', label: '주황', className: 'bg-[#fae7ce]' },
  { id: 'gray', label: '회색', className: 'bg-[#e9e9e9]' },
  { id: 'green', label: '초록', className: 'bg-[#cefad3]' },
]

export function tagClass(color) {
  return (TAG_COLORS.find((c) => c.id === color) ?? TAG_COLORS[4]).className
}

// Image sizes in the member app's HH01 cards.
export const EVENT_IMAGE = { width: 100, height: 130 }
export const CAFE_IMAGE = { width: 140, height: 80 }

// Where an event or cafe period stands today: 'upcoming' | 'ongoing' | 'ended'.
export function periodStatus({ startDate, endDate }, today = todayKey()) {
  if (endDate < today) return 'ended'
  if (startDate > today) return 'upcoming'
  return 'ongoing'
}

export const PERIOD_LABELS = {
  upcoming: '예정',
  ongoing: '진행 중',
  ended: '종료',
}

// Admin-side text: Korean when written, otherwise English.
export const pickText = (text) => text?.ko || text?.en || ''

// Shown as an Event coming up card: entries with an image.
export const isEvent = (entry) => Boolean(entry.imageUrl)

// The fan calendar's items: entries with inCalendar, on their start date.
// { [date]: [entry] }
export function calendarDays(entries) {
  const days = {}
  for (const entry of entries) {
    if (entry.inCalendar) (days[entry.startDate] ??= []).push(entry)
  }
  return days
}

// Group names for a list row: "ALL" or "ATEEZ, SVT".
export function groupNames(groupIds, groups) {
  if (groupIds.includes(ALL_GROUPS)) return 'ALL'
  return groupIds
    .map((id) => groups.find((g) => g.id === id)?.name.en ?? id)
    .join(', ')
}
