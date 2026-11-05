import {
  promotionFromApi,
  promotionToApi,
  withContentErrors,
} from './adapters/content.js'
import { request } from './client.js'

// Promotion: { id, placement: 'HOME' | 'DIARY', adminTitle, imageUrl,
//   title, description, ctaLabel — { en, ko, zh, ja } (ctaLabel: DIARY only),
//   targetType: 'DIARY' | 'URL', targetUrl,
//   startDate, endDate — 'YYYY-MM-DD' (null for the default banner),
//   enabled, isDefault, createdAt (ISO) }
//
// The member app gets HOME as home.getMainPromos (HH01) and DIARY as
// diaries.getDiaryBanners (DD01): the default banner, plus enabled ones
// within their period — Korean time, through 23:59 of endDate — in the
// admin order. Nothing turns a banner off when it ends; it just isn't served.

// ── 실제 백엔드: /api/v1/admin/banners (adapters/content.js) ──
// 없는 배너는 'NOT_FOUND', 기본 배너 끄기·삭제는 'DEFAULT_PROMOTION'.

const BANNERS = '/api/v1/admin/banners'

const call = (suffix = '', options) =>
  withContentErrors(request(`${BANNERS}${suffix}`, options))

// placement null: every promotion, newest first. HOME / DIARY: that
// placement's promotions in the admin order.
export async function getPromotions(placement = null) {
  const query = placement ? `?${new URLSearchParams({ placement })}` : ''
  return ((await call(query)) ?? []).map(promotionFromApi)
}

// Rejects with 'NOT_FOUND'.
export async function getPromotion(id) {
  return promotionFromApi(await call(`/${id}`))
}

// fields: the Promotion fields above except id, enabled and createdAt.
// Added last in its placement, turned on. isDefault true (optional): created
// as the placement's default banner (as setDefaultPromotion; no period).
export async function createPromotion(fields) {
  const body = promotionToApi(fields)
  if (fields.isDefault) {
    Object.assign(body, { isDefault: true, startDate: null, endDate: null })
  }
  return promotionFromApi(await call('', { method: 'POST', body }))
}

// fields: as createPromotion; the placement can't change. The default
// banner keeps no period.
export async function updatePromotion(id, fields) {
  return promotionFromApi(
    await call(`/${id}`, {
      method: 'PUT',
      body: promotionToApi(fields, { editing: true }),
    }),
  )
}

// The list's on/off switch. Rejects with 'DEFAULT_PROMOTION' for the
// default banner (always on).
export async function setPromotionEnabled(id, enabled) {
  await call(`/${id}/enabled`, { method: 'PATCH', body: { enabled } })
}

// Makes the promotion its placement's default banner: always on, no period.
// The previous default stays on as an ordinary banner (no period), so it can
// then be turned off or deleted. Resolves with that placement's promotions
// in the admin order. Rejects with 'NOT_FOUND'.
export async function setDefaultPromotion(id) {
  const list = await call(`/${id}/default`, { method: 'PATCH' })
  return (list ?? []).map(promotionFromApi)
}

// Rejects with 'DEFAULT_PROMOTION' for the default banner.
export async function deletePromotion(id) {
  await call(`/${id}`, { method: 'DELETE' })
}

// ids: every promotion of the placement, in the new order (first = shown first).
export async function reorderPromotions(placement, ids) {
  await call('/reorder', { method: 'PUT', body: { placement, ids } })
}
