import { promotions } from '../mocks/db.js'
import { ApiError, handle } from '../mocks/server.js'

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

function find(id) {
  const promotion = promotions.find((p) => p.id === id)
  if (!promotion) throw new ApiError('NOT_FOUND')
  return promotion
}

function editable(id) {
  const promotion = find(id)
  if (promotion.isDefault) throw new ApiError('DEFAULT_PROMOTION')
  return promotion
}

// placement null: every promotion, newest first. HOME / DIARY: that
// placement's promotions in the admin order.
export function getPromotions(placement = null) {
  return handle(() =>
    placement
      ? promotions.filter((p) => p.placement === placement)
      : [...promotions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  )
}

// Rejects with 'NOT_FOUND'.
export function getPromotion(id) {
  return handle(() => find(id))
}

// fields: the Promotion fields above except id, enabled, isDefault and
// createdAt. Added last in its placement, turned on.
export function createPromotion(fields) {
  return handle(() => {
    const promotion = {
      ...fields,
      id: `pr-${Date.now()}`,
      enabled: true,
      isDefault: false,
      createdAt: new Date().toISOString(),
    }
    promotions.push(promotion)
    return promotion
  })
}

// fields: as createPromotion; the placement can't change. The default
// banner keeps no period.
export function updatePromotion(id, fields) {
  return handle(() => {
    const promotion = find(id)
    Object.assign(promotion, fields, {
      placement: promotion.placement,
      ...(promotion.isDefault && { startDate: null, endDate: null }),
    })
    return promotion
  })
}

// The list's on/off switch. Rejects with 'DEFAULT_PROMOTION' for the
// default banner (always on).
export function setPromotionEnabled(id, enabled) {
  return handle(() => {
    editable(id).enabled = enabled
  })
}

// Rejects with 'DEFAULT_PROMOTION' for the default banner.
export function deletePromotion(id) {
  return handle(() => {
    const index = promotions.indexOf(editable(id))
    promotions.splice(index, 1)
  })
}

// ids: every promotion of the placement, in the new order (first = shown first).
export function reorderPromotions(placement, ids) {
  return handle(() => {
    const ordered = ids.map(find)
    const others = promotions.filter((p) => p.placement !== placement)
    promotions.splice(0, promotions.length, ...others, ...ordered)
  })
}
