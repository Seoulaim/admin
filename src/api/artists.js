import { todayKey } from '../lib/dates.js'
import { groups } from '../mocks/artists.js'
import { birthdayCafes, calendarEntries } from '../mocks/db.js'
import { places } from '../mocks/places.js'
import { ApiError, handle } from '../mocks/server.js'

// Group: { id, name, imageUrl, debutDate, note, updatedAt, members }
// Member: { id, name, imageUrl, birthDate }
// name: { en, ko, zh, ja } (en required). imageUrl: '' when there's none.
// debutDate / birthDate: 'YYYY-MM-DD' or null. note: admin-only memo.
// updatedAt: 'YYYY-MM-DD' of the last save.
//
// The member app (HH02 / HC04 bias pickers) gets groups and their members
// in this order. Its search matches member names in every language.
// Member ids are what biases, events (groupIds) and birthday cafes
// (memberId) point to, so they never change once made.
//
// Everything that picks groups or members (이벤트 관리's group filter and
// group chips, the birthday cafe member picker) reads getGroups, so new
// groups show up there and deleted ones disappear. Deleting also cleans up
// what pointed at them (see getGroupLinks).

const removeWhere = (list, test) => {
  for (let i = list.length - 1; i >= 0; i--)
    if (test(list[i])) list.splice(i, 1)
}

// Deleted members: their birthday cafes go, and places drop their tags.
function forgetMembers(memberIds) {
  removeWhere(birthdayCafes, (cafe) => memberIds.includes(cafe.memberId))
  for (const place of places) {
    place.memberIds = place.memberIds.filter((id) => !memberIds.includes(id))
  }
}

function find(id) {
  const group = groups.find((g) => g.id === id)
  if (!group) throw new ApiError('NOT_FOUND')
  return group
}

// New members (no id yet) get one; existing ones keep theirs.
function withMemberIds(members) {
  return members.map((member, i) =>
    member.id ? member : { ...member, id: `m-${Date.now()}-${i}` },
  )
}

// What deleting the group (or one of its members) also changes:
// { onlyEntries, sharedEntries, cafes: { [memberId]: count },
//   places: { [memberId]: count } }
// - onlyEntries: calendar entries / events with only this group — deleted
//   with it.
// - sharedEntries: ones with other groups too — this group is taken off.
// - cafes: each member's birthday cafes — deleted with the member.
// - places: places tagged with each member — the tag is taken off.
export function getGroupLinks(id) {
  return handle(() => {
    const group = find(id)
    const withGroup = calendarEntries.filter((e) => e.groupIds.includes(id))
    const only = withGroup.filter((e) => e.groupIds.length === 1).length
    const countBy = (list, test) => {
      const counts = {}
      for (const member of group.members) {
        const count = list.filter((item) => test(item, member.id)).length
        if (count) counts[member.id] = count
      }
      return counts
    }
    return {
      onlyEntries: only,
      sharedEntries: withGroup.length - only,
      cafes: countBy(birthdayCafes, (cafe, id) => cafe.memberId === id),
      places: countBy(places, (place, id) => place.memberIds.includes(id)),
    }
  })
}

// Groups in the admin order, each with its members in order.
export function getGroups() {
  return handle(() => groups)
}

// Rejects with 'NOT_FOUND'.
export function getGroup(id) {
  return handle(() => find(id))
}

// fields: { name, imageUrl, debutDate, note, members } — members in order.
// Added last.
export function createGroup(fields) {
  return handle(() => {
    const group = {
      ...fields,
      id: `g-${Date.now()}`,
      members: withMemberIds(fields.members),
      updatedAt: todayKey(),
    }
    groups.push(group)
    return group
  })
}

// fields: as createGroup. Members left out of `members` are deleted, with
// their birthday cafes (the backend also takes them off members' biases).
export function updateGroup(id, fields) {
  return handle(() => {
    const group = find(id)
    const kept = new Set(fields.members.map((m) => m.id))
    forgetMembers(group.members.filter((m) => !kept.has(m.id)).map((m) => m.id))
    Object.assign(group, fields, {
      members: withMemberIds(fields.members),
      updatedAt: todayKey(),
    })
    return group
  })
}

// Deletes the group and its members, with what getGroupLinks lists.
export function deleteGroup(id) {
  return handle(() => {
    const group = find(id)
    removeWhere(
      calendarEntries,
      (e) => e.groupIds.length === 1 && e.groupIds[0] === id,
    )
    for (const entry of calendarEntries) {
      entry.groupIds = entry.groupIds.filter((g) => g !== id)
    }
    forgetMembers(group.members.map((m) => m.id))
    groups.splice(groups.indexOf(group), 1)
  })
}

// ids: every group id in the new order (first = shown first in the app).
export function reorderGroups(ids) {
  return handle(() => {
    groups.splice(0, groups.length, ...ids.map(find))
  })
}
