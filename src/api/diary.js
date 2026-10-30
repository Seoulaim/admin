import {
  fonts,
  stickerCategories,
  stickers,
  templates,
} from '../mocks/diary.js'
import { ApiError, handle } from '../mocks/server.js'

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

const templateList = list(templates, 'tpl')
const stickerList = list(stickers, 'st')
const categoryList = list(stickerCategories, 'sc')
const fontList = list(fonts, 'font')

export const getTemplates = templateList.all
export const getTemplate = templateList.get
// fields: { name, imageUrl, overlayUrl, aspect, frames }. Starts visible.
export const createTemplate = (fields) =>
  templateList.create({ ...fields, visible: true, usedBy: 0 })
export const updateTemplate = templateList.update
export const setTemplateVisible = (id, visible) =>
  templateList.update(id, { visible })
// Only when no diary being edited uses it ('TEMPLATE_IN_USE'): those can
// only hide it.
export const deleteTemplate = (id) =>
  handle(() => {
    if (templates.find((t) => t.id === id)?.usedBy > 0) {
      throw new ApiError('TEMPLATE_IN_USE')
    }
  }).then(() => templateList.remove(id))
export const reorderTemplates = templateList.reorder

export const getStickers = () =>
  handle(() => ({ categories: stickerCategories, stickers }))
// fields: { name, imageUrl, categoryIds }.
export const createSticker = stickerList.create
export const updateSticker = stickerList.update
export const deleteSticker = (id) => stickerList.remove(id)
export const reorderStickers = stickerList.reorder

// fields: { name }.
export const createStickerCategory = categoryList.create
export const updateStickerCategory = categoryList.update
// Its stickers stay, without this category.
export const deleteStickerCategory = (id) =>
  categoryList.remove(id, () => {
    for (const s of stickers) {
      s.categoryIds = s.categoryIds.filter((c) => c !== id)
    }
  })
export const reorderStickerCategories = categoryList.reorder

export const getFonts = fontList.all
// fields: { name, family, stylesheetUrl, previewScale }.
export const createFont = fontList.create
export const updateFont = fontList.update
// Text members wrote in it falls back to the first font.
export const deleteFont = (id) => fontList.remove(id)
export const reorderFonts = fontList.reorder
