import { seoulDateKey } from '../../lib/dates.js'
import { imageUrlFromKey, keyForUrl } from './image.js'

// 백엔드 AdminArtistGroupResponse ↔ 화면의 Group (api/artists.js 참고).
//
// 백엔드: { id, nameKo, nameEn, nameJa, nameZh, imageKey, debutDate,
//   displayOrder, updatedAt, members: [{ id, nameKo, nameEn, nameJa, nameZh,
//   imageKey, birthDate, displayOrder }] }
// 화면:   { id, name: { en, ko, zh, ja }, imageUrl, debutDate, note,
//   updatedAt, members: [{ id, name, imageUrl, birthDate }] }
//
// - name: 펼친 필드를 { en, ko, zh, ja } 로 묶고, 쓸 때 다시 펼친다.
//   백엔드는 nameKo 도 필수라 ko 가 비어 있으면 en 값을 보낸다.
// - imageKey ↔ imageUrl (업로드 domain ARTIST).
// - note: 백엔드에 없음 → '' (쓸 때 버림).
// - updatedAt: Instant → 서울 날짜 'YYYY-MM-DD'.
// - members 배열 순서 = 멤버 displayOrder (백엔드가 순서대로 매김).

export const nameFromApi = (raw) => ({
  en: raw.nameEn ?? '',
  ko: raw.nameKo ?? '',
  zh: raw.nameZh ?? '',
  ja: raw.nameJa ?? '',
})

export function nameToApi(name = {}) {
  const text = (language) => (name[language] ?? '').trim()
  return {
    nameEn: text('en'),
    nameKo: text('ko') || text('en'),
    nameJa: text('ja') || null,
    nameZh: text('zh') || null,
  }
}

const memberFromApi = (raw) => ({
  id: raw.id,
  name: nameFromApi(raw),
  imageUrl: imageUrlFromKey(raw.imageKey),
  birthDate: raw.birthDate ?? null,
})

export function groupFromApi(raw) {
  return {
    id: raw.id,
    name: nameFromApi(raw),
    imageUrl: imageUrlFromKey(raw.imageKey),
    debutDate: raw.debutDate ?? null,
    note: '',
    updatedAt: raw.updatedAt ? seoulDateKey(raw.updatedAt) : '',
    members: (raw.members ?? []).map(memberFromApi),
  }
}

const memberToApi = (member) => ({
  ...(member.id ? { id: member.id } : {}),
  ...nameToApi(member.name),
  imageKey: keyForUrl(member.imageUrl),
  birthDate: member.birthDate || null,
})

// AdminArtistGroupRequest. displayOrder: 새 그룹은 맨 뒤, 수정은 기존 값.
export function groupToApi(fields, displayOrder) {
  return {
    ...nameToApi(fields.name),
    imageKey: keyForUrl(fields.imageUrl),
    debutDate: fields.debutDate || null,
    displayOrder,
    members: (fields.members ?? []).map(memberToApi),
  }
}

// 순서만 바꿀 때: 서버 값 그대로 + 새 displayOrder. members 를 빼면
// 백엔드가 멤버를 건드리지 않는다.
export function groupOrderToApi(raw, displayOrder) {
  return {
    nameEn: raw.nameEn,
    nameKo: raw.nameKo,
    nameJa: raw.nameJa,
    nameZh: raw.nameZh,
    imageKey: raw.imageKey,
    debutDate: raw.debutDate,
    displayOrder,
  }
}
