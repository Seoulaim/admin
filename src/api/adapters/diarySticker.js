import { fileIdForUrl, imageUrlFromKey } from './image.js'

// 백엔드 AdminDiaryStickerResponse ↔ 화면의 Sticker (api/diary.js 참고).
//
// 백엔드: { id, name, imageKey, displayOrder, isActive, categoryIds }
// 화면:   { id, name: { en, ko, zh, ja }, imageUrl, categoryIds }
//
// - name: 문자열(없을 수 있음) → { en } 으로 읽고, 쓸 때는 name.en.
// - categoryIds: 그대로 (카테고리 노출 순서). 수정 때 보내면 전체 교체,
//   안 보내면 기존 연결 유지 (백엔드 #61).
// - isActive=false 는 삭제된 스티커로 보고 목록에서 뺀다 (api/diary.js).

export function stickerFromApi(raw) {
  return {
    id: raw.id,
    name: { en: raw.name ?? '', ko: '', zh: '', ja: '' },
    imageUrl: imageUrlFromKey(raw.imageKey),
    categoryIds: raw.categoryIds ?? [],
  }
}

// AdminDiaryStickerRequest. base: 지금 서버에 있는 값(raw) — 수정 때
// displayOrder 등을 이어받는다. imageFileId 는 새로 업로드한 이미지일 때만.
export function stickerToApi(fields, base = null) {
  const name = (fields.name?.en ?? base?.name ?? '').trim()
  const body = {
    name: name || null,
    displayOrder: fields.displayOrder ?? base?.displayOrder ?? 0,
  }
  if ('isActive' in fields) body.isActive = fields.isActive
  if (Array.isArray(fields.categoryIds)) body.categoryIds = fields.categoryIds
  const imageFileId = fileIdForUrl(fields.imageUrl)
  if (imageFileId) body.imageFileId = imageFileId
  return body
}

// 백엔드 AdminDiaryStickerCategory(List)Response ↔ 화면의 Category.
//
// 백엔드: { id, name, displayOrder, stickerCount? } — name 은 문자열 하나
// 화면:   { id, name: { en, ko, zh, ja } }
//
// - name: 다국어 아님 → { en } 으로 읽고, 쓸 때는 name.en 만 보낸다
//   (ko·zh·ja 는 버림).
export function stickerCategoryFromApi(raw) {
  return {
    id: raw.id,
    name: { en: raw.name ?? '', ko: '', zh: '', ja: '' },
  }
}

export function stickerCategoryToApi(fields) {
  return { name: (fields.name?.en ?? '').trim() }
}
