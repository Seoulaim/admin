import { birthdayCafes, calendarEntries } from '../mocks/db.js'
import { ApiError, handle } from '../mocks/server.js'

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

function collection(items, prefix) {
  const find = (id) => {
    const item = items.find((i) => i.id === id)
    if (!item) throw new ApiError('NOT_FOUND')
    return item
  }
  return {
    list: () => handle(() => items),
    get: (id) => handle(() => find(id)),
    create: (fields) =>
      handle(() => {
        const item = {
          ...fields,
          id: `${prefix}-${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
        items.push(item)
        return item
      }),
    update: (id, fields) =>
      handle(() => {
        const item = find(id)
        const updated = { ...fields, id, createdAt: item.createdAt }
        items[items.indexOf(item)] = updated
        return updated
      }),
    remove: (id) =>
      handle(() => {
        items.splice(items.indexOf(find(id)), 1)
      }),
  }
}

const entries = collection(calendarEntries, 'ce')
const cafes = collection(birthdayCafes, 'bc')

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
