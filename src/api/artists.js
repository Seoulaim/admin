import { ApiError } from '../lib/apiClient.js'
import { groupFromApi, groupOrderToApi, groupToApi } from './adapters/artist.js'
import { request } from './client.js'

// Group: { id, name, imageUrl, debutDate, note, updatedAt, members }
// Member: { id, name, imageUrl, birthDate }
// name: { en, ko, zh, ja } (en required). imageUrl: '' when there's none.
// debutDate / birthDate: 'YYYY-MM-DD' or null. note: admin-only memo.
// updatedAt: 'YYYY-MM-DD' of the last save.
//
// The member app (HH02 / HC04 bias pickers) gets groups and their members
// in this order. Its search matches both group and member names in every
// language (산, san, 에이티즈, ateez).
// Member ids are what biases, events (groupIds) and birthday cafes
// (memberId) point to, so they never change once made.
//
// ── 실제 백엔드: /api/v1/admin/artist-groups (adapters/artist.js) ──
// 백엔드에 없는 것:
// - 그룹 삭제·멤버 삭제 (멤버를 bias·장소·굿즈가 참조) → 'NOT_SUPPORTED'
// - 단건 조회 → 목록에서 찾는다
// - 순서 일괄 변경 → 바뀐 그룹만 displayOrder 를 PUT
// - 삭제 영향 미리보기(getGroupLinks) → 모두 0
// - 관리자 메모(note) → 저장되지 않음

const GROUPS = '/api/v1/admin/artist-groups'

const notSupported = () => Promise.reject(new ApiError('NOT_SUPPORTED'))

const getRawGroups = async () => (await request(GROUPS)).items ?? []

async function findRaw(id) {
  const group = (await getRawGroups()).find((g) => g.id === id)
  if (!group) throw new ApiError('ARTIST_GROUP_NOT_FOUND', { status: 404 })
  return group
}

// 그룹·멤버 삭제가 없어서 삭제 영향도 없다.
// { onlyEntries, sharedEntries, cafes: { [memberId]: count },
//   places: { [memberId]: count } }
export async function getGroupLinks() {
  return { onlyEntries: 0, sharedEntries: 0, cafes: {}, places: {} }
}

// Groups in the admin order, each with its members in order.
export async function getGroups() {
  return (await getRawGroups()).map(groupFromApi)
}

// Rejects with 'ARTIST_GROUP_NOT_FOUND'.
export async function getGroup(id) {
  return groupFromApi(await findRaw(id))
}

// fields: { name, imageUrl, debutDate, note, members } — members in order.
// Added last.
export async function createGroup(fields) {
  const raws = await getRawGroups()
  const displayOrder =
    raws.reduce((max, g) => Math.max(max, g.displayOrder), -1) + 1
  const created = await request(GROUPS, {
    method: 'POST',
    body: groupToApi(fields, displayOrder),
  })
  return groupFromApi(created)
}

// fields: as createGroup. 백엔드는 빠진 멤버를 지우지 않으므로, 저장된
// 멤버를 뺀 채 저장하면 아무것도 보내지 않고 'NOT_SUPPORTED' 로 reject.
export async function updateGroup(id, fields) {
  const base = await findRaw(id)
  const kept = new Set(fields.members.map((m) => m.id).filter(Boolean))
  if (base.members.some((m) => !kept.has(m.id))) {
    throw new ApiError('NOT_SUPPORTED')
  }
  const updated = await request(`${GROUPS}/${id}`, {
    method: 'PUT',
    body: groupToApi(fields, base.displayOrder),
  })
  return groupFromApi(updated)
}

// 백엔드에 그룹 삭제가 없다.
export const deleteGroup = notSupported

// ids: every group id in the new order (first = shown first in the app).
// displayOrder 0, 1, 2 … — 바뀐 그룹만 PUT (멤버는 그대로).
export async function reorderGroups(ids) {
  const byId = new Map((await getRawGroups()).map((g) => [g.id, g]))
  await Promise.all(
    ids.map((id, displayOrder) => {
      const raw = byId.get(id)
      if (!raw || raw.displayOrder === displayOrder) return null
      return request(`${GROUPS}/${id}`, {
        method: 'PUT',
        body: groupOrderToApi(raw, displayOrder),
      })
    }),
  )
}
