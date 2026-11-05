import { ApiError } from '../../lib/apiClient.js'
import { fileIdForUrl, imageUrlFromKey } from './image.js'

// 백엔드 content 도메인 (domain/content/admin, docs/content-flow.md) ↔ 화면
// 형태 (api/events.js, api/promotions.js 참고).
//
// - imageKey ↔ imageUrl. 쓸 때: 이번에 올린 이미지면 imageFileId (업로드
//   domain CONTENT), 기존 이미지면 생략(유지), 수정에서 imageUrl 이 비면
//   removeImage: true.
// - 다국어 문구 { en, ko, zh, ja } 는 그대로 (백엔드가 빈 언어를 버림).
//   읽을 때 null → {}.
// - 캘린더 항목: groupIds(['all'] 포함)·color(소문자) 그대로,
//   targetUrl null → ''.
// - 생일카페: artistId ↔ memberId.
// - 배너: placement·isDefault·enabled 그대로, targetUrl null → ''.
// - 에러: CONTENT_NOT_FOUND → 'NOT_FOUND',
//   CONTENT_DEFAULT_BANNER → 'DEFAULT_PROMOTION' (mock 과 같은 코드).

const ERROR_CODES = {
  CONTENT_NOT_FOUND: 'NOT_FOUND',
  CONTENT_DEFAULT_BANNER: 'DEFAULT_PROMOTION',
}

// 백엔드 에러 코드를 화면(mock)이 쓰는 코드로 바꿔 다시 reject.
export async function withContentErrors(promise) {
  try {
    return await promise
  } catch (error) {
    const code = error instanceof ApiError && ERROR_CODES[error.code]
    if (!code) throw error
    throw new ApiError(code, { status: error.status, details: error.details })
  }
}

const textFromApi = (map) => ({ ...(map ?? {}) })

// 화면 { en, ko, zh, ja } → 빈 칸을 뺀 앞뒤 공백 없는 값.
function textToApi(text) {
  const result = {}
  for (const [lang, value] of Object.entries(text ?? {})) {
    const trimmed = (value ?? '').trim()
    if (trimmed) result[lang] = trimmed
  }
  return result
}

// 이미지 필드: 새 업로드 → imageFileId, 비었고 수정이면 removeImage,
// 기존 이미지 → 둘 다 생략(백엔드가 유지).
function imageToApi(imageUrl, editing) {
  const imageFileId = fileIdForUrl(imageUrl)
  if (imageFileId) return { imageFileId }
  if (!imageUrl && editing) return { removeImage: true }
  return {}
}

const blankToNull = (value) => (value ?? '').trim() || null

// ---------- 캘린더 항목 (팬캘린더 · Event coming up) ----------

export function entryFromApi(raw) {
  return {
    id: raw.id,
    groupIds: raw.groupIds ?? [],
    title: textFromApi(raw.title),
    startDate: raw.startDate,
    inCalendar: Boolean(raw.inCalendar),
    color: raw.color ? raw.color.toLowerCase() : null,
    imageUrl: imageUrlFromKey(raw.imageKey),
    endDate: raw.endDate ?? null,
    venue: textFromApi(raw.venue),
    targetUrl: raw.targetUrl ?? '',
    createdAt: raw.createdAt,
  }
}

export function entryToApi(fields, { editing = false } = {}) {
  return {
    groupIds: fields.groupIds,
    title: textToApi(fields.title),
    startDate: fields.startDate,
    inCalendar: Boolean(fields.inCalendar),
    color:
      fields.inCalendar && fields.color ? fields.color.toLowerCase() : null,
    ...imageToApi(fields.imageUrl, editing),
    endDate: fields.endDate || null,
    venue: textToApi(fields.venue),
    targetUrl: blankToNull(fields.targetUrl),
  }
}

// ---------- 생일카페 ----------

export function cafeFromApi(raw) {
  return {
    id: raw.id,
    memberId: raw.artistId,
    venue: textFromApi(raw.venue),
    startDate: raw.startDate,
    endDate: raw.endDate,
    imageUrl: imageUrlFromKey(raw.imageKey),
    linkUrl: raw.linkUrl ?? '',
    createdAt: raw.createdAt,
  }
}

export function cafeToApi(fields, { editing = false } = {}) {
  return {
    artistId: fields.memberId,
    venue: textToApi(fields.venue),
    startDate: fields.startDate,
    endDate: fields.endDate,
    ...imageToApi(fields.imageUrl, editing),
    linkUrl: blankToNull(fields.linkUrl),
  }
}

// ---------- 배너 (프로모션) ----------

export function promotionFromApi(raw) {
  return {
    id: raw.id,
    placement: raw.placement,
    adminTitle: raw.adminTitle ?? '',
    imageUrl: imageUrlFromKey(raw.imageKey),
    title: textFromApi(raw.title),
    description: textFromApi(raw.description),
    ctaLabel: textFromApi(raw.ctaLabel),
    targetType: raw.targetType,
    targetUrl: raw.targetUrl ?? '',
    startDate: raw.startDate ?? null,
    endDate: raw.endDate ?? null,
    enabled: Boolean(raw.enabled),
    isDefault: Boolean(raw.isDefault),
    createdAt: raw.createdAt,
  }
}

export function promotionToApi(fields, { editing = false } = {}) {
  return {
    placement: fields.placement,
    adminTitle: (fields.adminTitle ?? '').trim(),
    ...imageToApi(fields.imageUrl, editing),
    title: textToApi(fields.title),
    description: textToApi(fields.description),
    ctaLabel: textToApi(fields.ctaLabel),
    targetType: fields.targetType,
    targetUrl:
      fields.targetType === 'URL' ? blankToNull(fields.targetUrl) : null,
    startDate: fields.startDate || null,
    endDate: fields.endDate || null,
  }
}
