import {
  cafeFromApi,
  cafeToApi,
  entryFromApi,
  entryToApi,
  withContentErrors,
} from './adapters/content.js'
import { request } from './client.js'

// 이벤트 관리: HH01 "Event coming up", fan calendar and "Birthday cafe".
//
// Calendar entry: { id, groupIds, title, startDate, inCalendar, color,
//   imageUrl, endDate, venue, targetUrl, createdAt }
// - Fan calendar: entries with inCalendar, on startDate, as title in color
//   (pink | purple | blue | orange | gray | green).
// - Event coming up: entries with an image; they also have endDate, venue
//   and targetUrl (the link the card opens). The calendar never shows the
//   image.
// Added from the calendar: inCalendar, with or without a photo. Added from
// the Event coming up tab: inCalendar false, photo required. Without a
// photo, endDate is null and venue / targetUrl are empty.
// Birthday cafe: { id, memberId, venue, startDate, endDate, imageUrl,
//   linkUrl, createdAt }
// title / venue: { en, ko, zh, ja }; dates 'YYYY-MM-DD'.
// groupIds: at least one group id, or ['all'] for everyone.
//
// What the member app gets (the backend filters by the member's biases):
// - Bias groups = the groups of the member's biases. Logged out or no
//   biases yet: everything.
// - Event coming up (with an image, not ended) and Birthday cafe (not
//   ended): those with a bias group or 'all' (a cafe: its member's group).
//   When no item is for a bias group itself, everything instead: matching
//   only 'all' items counts as none (an ILLIT fan with no ILLIT event gets
//   every card).
// - Fan calendar: no fallback, only inCalendar entries with a bias group or
//   'all', even when that leaves it empty.

// ── 실제 백엔드 (adapters/content.js) ──
// /api/v1/admin/calendar-entries, /api/v1/admin/birthday-cafes.
// 새 항목은 백엔드가 맨 뒤 순서로 붙인다. 없으면 'NOT_FOUND' 로 reject.
// 그룹·멤버 선택은 api/artists.js (백엔드) 의 id 를 그대로 쓴다.

function collection(path, fromApi, toApi) {
  const call = (suffix = '', options) =>
    withContentErrors(request(`${path}${suffix}`, options))
  return {
    list: async () => ((await call()) ?? []).map(fromApi),
    get: async (id) => fromApi(await call(`/${id}`)),
    create: async (fields) =>
      fromApi(await call('', { method: 'POST', body: toApi(fields) })),
    update: async (id, fields) =>
      fromApi(
        await call(`/${id}`, {
          method: 'PUT',
          body: toApi(fields, { editing: true }),
        }),
      ),
    remove: async (id) => {
      await call(`/${id}`, { method: 'DELETE' })
    },
  }
}

const entries = collection(
  '/api/v1/admin/calendar-entries',
  entryFromApi,
  entryToApi,
)
const cafes = collection('/api/v1/admin/birthday-cafes', cafeFromApi, cafeToApi)

export const getCalendarEntries = entries.list
export const getCalendarEntry = entries.get
// fields: a calendar entry without id / createdAt.
export const createCalendarEntry = entries.create
export const updateCalendarEntry = entries.update
export const deleteCalendarEntry = entries.remove

export const getBirthdayCafes = cafes.list
export const getBirthdayCafe = cafes.get
export const createBirthdayCafe = cafes.create
export const updateBirthdayCafe = cafes.update
export const deleteBirthdayCafe = cafes.remove
