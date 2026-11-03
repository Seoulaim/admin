import { fonts } from '../mocks/diary.js'
import { ApiError, handle } from '../mocks/server.js'
import { templateFromApi, templateToApi } from './adapters/diaryTemplate.js'
import { stickerFromApi, stickerToApi } from './adapters/diarySticker.js'
import { request } from './client.js'

// 다이어리 관리: what the member app's editor offers (DD05). Every list is
// served in the admin order (diaries.getDiaryTemplates / getEditorStickers /
// getEditorFonts). Names are { en, ko, zh, ja } (en required).
//
// Template: { id, name, imageUrl, overlayUrl, aspect, frames, visible,
//   usedBy } — see the member app's docs/diary-templates.md.
//   imageUrl: the background (photo frames and decorations left out);
//   overlayUrl: decorations drawn over the photos ('' when none), same size;
//   aspect: image width / height (spreads are A4 landscape, 297:210);
//   frames: [{ id, x, y, width, height, rotation }] — fractions of the
//   image, x / y the top-left of the unrotated box, rotation in degrees
//   around its center. Photos fill frames in this order. Member diaries
//   tie their photos to frame ids, so ids never change once used
//   (usedBy: how many diaries being edited use the template; finished ones
//   are images and don't count).
//   No writing spots: post-its are drawn in the background and members add
//   their own text.
//   visible false: left out of the app's template picker, nothing else.
//   Finished diaries are images, so nothing changes for them. A page being
//   edited that has anything on it (photo, sticker, text, pen) stays as it
//   is — the server sends the template along. A page with only the template
//   on it loses the template.
// Sticker: { id, name, imageUrl, categoryIds } — transparent PNG / WebP or
//   a plain vector SVG. Category: { id, name } ("All" is added by the app).
// Font: { id, name, family, stylesheetUrl, previewScale } — stylesheetUrl
//   is CSS that loads the font (CORS allowed: PDFs embed it), family its
//   CSS font-family. The first font is the text tool's default.

function list(items, prefix) {
  const find = (id) => {
    const item = items.find((i) => i.id === id)
    if (!item) throw new ApiError('NOT_FOUND')
    return item
  }
  return {
    all: () => handle(() => items),
    get: (id) => handle(() => find(id)),
    // Added last.
    create: (fields) =>
      handle(() => {
        const item = { ...fields, id: `${prefix}-${Date.now()}` }
        items.push(item)
        return item
      }),
    update: (id, fields) => handle(() => Object.assign(find(id), fields)),
    remove: (id, cleanUp) =>
      handle(() => {
        items.splice(items.indexOf(find(id)), 1)
        cleanUp?.()
      }),
    // ids: every item in the new order.
    reorder: (ids) =>
      handle(() => {
        items.splice(0, items.length, ...ids.map(find))
      }),
  }
}

const fontList = list(fonts, 'font')

// ── 템플릿·스티커: 실제 백엔드 (/api/v1/admin/diary-templates, -stickers) ──
// 응답은 adapters/ 가 위 형태로 맞춘다. 백엔드에 없는 것:
// - 템플릿 usedBy(→ 0), 삭제(→ 'NOT_SUPPORTED', 숨기기만 가능),
//   다국어 이름(en 만 저장)
// - 스티커 카테고리(→ categories: [], 카테고리 함수는 'NOT_SUPPORTED')
// - 순서 일괄 변경: displayOrder 를 항목별 PUT 으로 맞춘다.
// - 단건 조회: 목록에서 찾는다.

const TEMPLATES = '/api/v1/admin/diary-templates'
const STICKERS = '/api/v1/admin/diary-stickers'

const notSupported = () => Promise.reject(new ApiError('NOT_SUPPORTED'))

// 목록 맨 뒤 순서.
const nextOrder = (items) =>
  items.reduce((max, item) => Math.max(max, item.displayOrder), -1) + 1

async function findRaw(path, id, notFound) {
  const item = (await request(path)).find((i) => i.id === id)
  if (!item) throw new ApiError(notFound, { status: 404 })
  return item
}

// ids 순서대로 displayOrder 0, 1, 2 … — 바뀐 항목만 PUT.
async function reorderRaw(path, ids, toApi) {
  const byId = new Map((await request(path)).map((i) => [i.id, i]))
  await Promise.all(
    ids.map((id, displayOrder) => {
      const raw = byId.get(id)
      if (!raw || raw.displayOrder === displayOrder) return null
      return request(`${path}/${id}`, {
        method: 'PUT',
        body: toApi({ displayOrder }, raw),
      })
    }),
  )
}

export const getTemplates = async () =>
  (await request(TEMPLATES)).map(templateFromApi)
export const getTemplate = async (id) =>
  templateFromApi(await findRaw(TEMPLATES, id, 'DIARY_TEMPLATE_NOT_FOUND'))
// fields: { name, imageUrl, overlayUrl, aspect, frames }. Starts visible.
export async function createTemplate(fields) {
  const displayOrder = nextOrder(await request(TEMPLATES))
  const created = await request(TEMPLATES, {
    method: 'POST',
    body: templateToApi({ ...fields, displayOrder }),
  })
  return templateFromApi(created)
}
export async function updateTemplate(id, fields) {
  const base = await findRaw(TEMPLATES, id, 'DIARY_TEMPLATE_NOT_FOUND')
  const updated = await request(`${TEMPLATES}/${id}`, {
    method: 'PUT',
    body: templateToApi(fields, base),
  })
  return templateFromApi(updated)
}
export const setTemplateVisible = (id, visible) =>
  updateTemplate(id, { visible })
// 백엔드에 삭제가 없다: 숨기기(setTemplateVisible)만 가능.
export const deleteTemplate = notSupported
export const reorderTemplates = (ids) =>
  reorderRaw(TEMPLATES, ids, templateToApi)

// 비활성(isActive=false) 스티커는 삭제된 것으로 보고 뺀다.
export async function getStickers() {
  const raw = await request(STICKERS)
  return {
    categories: [],
    stickers: raw.filter((s) => s.isActive).map(stickerFromApi),
  }
}
// fields: { name, imageUrl, categoryIds } (categoryIds 는 버림).
export async function createSticker(fields) {
  const displayOrder = nextOrder(await request(STICKERS))
  const created = await request(STICKERS, {
    method: 'POST',
    body: stickerToApi({ ...fields, displayOrder }),
  })
  return stickerFromApi(created)
}
export async function updateSticker(id, fields) {
  const base = await findRaw(STICKERS, id, 'DIARY_STICKER_NOT_FOUND')
  const updated = await request(`${STICKERS}/${id}`, {
    method: 'PUT',
    body: stickerToApi(fields, base),
  })
  return stickerFromApi(updated)
}
// soft delete: isActive=false (백엔드에 DELETE 가 없다).
export async function deleteSticker(id) {
  await updateSticker(id, { isActive: false })
}
export const reorderStickers = (ids) => reorderRaw(STICKERS, ids, stickerToApi)

// 스티커 카테고리: 백엔드에 없음.
export const createStickerCategory = notSupported
export const updateStickerCategory = notSupported
export const deleteStickerCategory = notSupported
export const reorderStickerCategories = notSupported

export const getFonts = fontList.all
// fields: { name, family, stylesheetUrl, previewScale }.
export const createFont = fontList.create
export const updateFont = fontList.update
// Text members wrote in it falls back to the first font.
export const deleteFont = (id) => fontList.remove(id)
export const reorderFonts = fontList.reorder
