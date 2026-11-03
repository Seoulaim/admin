import { fileIdForUrl, imageUrlFromKey } from './image.js'

// 백엔드 AdminDiaryTemplateResponse ↔ 화면의 Template (api/diary.js 참고).
//
// 백엔드: { id, name, description, imageKey, displayOrder, isActive,
//   overlayImageKey, aspect, frames: [{ id, x, y, width, height, rotation }] }
// 화면:   { id, name: { en, ko, zh, ja }, imageUrl, overlayUrl, aspect,
//   frames, visible, usedBy }
//
// - name: 백엔드는 문자열 하나 → { en } 으로 읽고, 쓸 때는 name.en 만 보낸다
//   (ko·zh·ja 는 저장되지 않음).
// - usedBy: 백엔드에 없음 → 0.
// - description·displayOrder: 화면에 없음 → 조회한 값을 그대로 다시 보낸다.

export const DEFAULT_ASPECT = 297 / 210

export function templateFromApi(raw) {
  return {
    id: raw.id,
    name: { en: raw.name ?? '', ko: '', zh: '', ja: '' },
    imageUrl: imageUrlFromKey(raw.imageKey),
    overlayUrl: imageUrlFromKey(raw.overlayImageKey),
    aspect: raw.aspect || DEFAULT_ASPECT,
    frames: (raw.frames ?? []).map((f) => ({
      id: f.id,
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      rotation: f.rotation ?? 0,
    })),
    visible: raw.isActive,
    usedBy: 0,
  }
}

// AdminDiaryTemplateRequest. base: 지금 서버에 있는 값(raw) — 수정 때
// description·displayOrder·isActive 를 이어받는다. fields 에 없는 화면
// 필드(aspect, frames 등)는 생략해 서버의 기존 값을 유지한다.
// imageFileId·overlayFileId 는 새로 업로드한 이미지일 때만 보낸다.
export function templateToApi(fields, base = null) {
  const body = {
    name: (fields.name?.en ?? base?.name ?? '').trim(),
    description: base?.description ?? null,
    displayOrder: fields.displayOrder ?? base?.displayOrder ?? 0,
  }
  if ('visible' in fields) body.isActive = fields.visible
  const imageFileId = fileIdForUrl(fields.imageUrl)
  if (imageFileId) body.imageFileId = imageFileId
  const overlayFileId = fileIdForUrl(fields.overlayUrl)
  if (overlayFileId) body.overlayFileId = overlayFileId
  if (fields.aspect != null) body.aspect = fields.aspect
  if (fields.frames) {
    body.frames = fields.frames.map(
      ({ id, x, y, width, height, rotation }) => ({
        id,
        x,
        y,
        width,
        height,
        rotation: rotation ?? 0,
      }),
    )
  }
  return body
}
