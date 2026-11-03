import { fileIdForUrl, imageUrlFromKey } from './image.js'

// 백엔드 AdminDiaryStickerResponse ↔ 화면의 Sticker (api/diary.js 참고).
//
// 백엔드: { id, name, imageKey, displayOrder, isActive }
// 화면:   { id, name: { en, ko, zh, ja }, imageUrl, categoryIds }
//
// - name: 문자열(없을 수 있음) → { en } 으로 읽고, 쓸 때는 name.en.
// - categoryIds: 백엔드에 카테고리 없음 → [] (쓸 때 버림).
// - isActive=false 는 삭제된 스티커로 보고 목록에서 뺀다 (api/diary.js).

export function stickerFromApi(raw) {
  return {
    id: raw.id,
    name: { en: raw.name ?? '', ko: '', zh: '', ja: '' },
    imageUrl: imageUrlFromKey(raw.imageKey),
    categoryIds: [],
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
  const imageFileId = fileIdForUrl(fields.imageUrl)
  if (imageFileId) body.imageFileId = imageFileId
  return body
}
