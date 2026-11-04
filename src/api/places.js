import { loadNaverGeocoder } from '../lib/naverMaps.js'
import { ApiError } from '../lib/apiClient.js'
import {
  keywordFromApi,
  placeDetailToApi,
  placeFromApi,
  placeToApi,
} from './adapters/place.js'
import { getGroups } from './artists.js'
import { request } from './client.js'

// Place: { id, name, topic, address, lat, lng, naverMapUrl, phone, website,
//   videoUrls, photos, memberIds, keywordIds, hours, visible, updatedAt }
// - name / topic: { en, ko, zh, ja } (en required).
// - address: { ko, en, zh, ja } — ko (what Geocoding reads) and en required.
// - lat / lng: the map pin, from geocodeAddress or dragged by the admin.
// - naverMapUrl: '' → the app links to a Naver Map search for the name.
// - videoUrls: up to 5 links (YouTube, …) showing why it's a fandom place.
// - photos: up to 5 image URLs, the first is the main one.
// - memberIds: tagged members (any groups, always per member — a place
//   for a whole group lists each member). keywordIds: HC05 keywords.
// - hours: null when it has none (parks, streets …), otherwise
//   { mon … sun: null (closed) | { open, close, breaks: [{ start, end }] } }
//   in Seoul time, 'HH:MM'; close may be '24:00' or past midnight
//   (earlier than open).
// - visible: false keeps it out of new plans (plans that have it keep it).
//
// Keyword: { id, name: { en, ko, zh, ja } }, in the HC05 order.
// Place 의 keywordIds 는 Keyword 의 id.

// ── 장소: 실제 백엔드 /api/v1/admin/places (adapters/place.js) ──
// 백엔드 목록은 요약 + 커서 페이징이라, 화면이 쓰는 전체 필드를 위해 모든
// 페이지를 받은 뒤 상세를 동시 DETAIL_CONCURRENCY 개씩 조회한다.
// 등록·수정은 전체 교체(PUT) — 화면에 없는 필드는 기존 값을 이어 보낸다.
// 백엔드에 없는 것: topic, naverMapUrl, videoUrls, 다국어 이름·주소,
// 하루 2개 이상의 브레이크.

const PLACES = '/api/v1/admin/places'
const PAGE_SIZE = 50 // 백엔드 최대
const DETAIL_CONCURRENCY = 6

const getRawPlace = (id) => request(`${PLACES}/${id}`)

async function getPlaceIds() {
  const ids = []
  let cursor = null
  do {
    const query = new URLSearchParams({ size: PAGE_SIZE })
    if (cursor) query.set('cursor', cursor)
    const page = await request(`${PLACES}?${query}`)
    ids.push(...page.items.map((item) => item.id))
    cursor = page.nextCursor
  } while (cursor)
  return ids
}

// fn 을 items 에 최대 limit 개씩 동시에, 결과는 items 순서대로.
async function mapLimited(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  )
  return results
}

// Newest edit first.
export async function getPlaces() {
  const [ids, groups] = await Promise.all([getPlaceIds(), getGroups()])
  const raws = await mapLimited(ids, DETAIL_CONCURRENCY, getRawPlace)
  return raws
    .map((raw) => placeFromApi(raw, groups))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

// Rejects with 'PLACE_NOT_FOUND'.
export async function getPlace(id) {
  const [raw, groups] = await Promise.all([getRawPlace(id), getGroups()])
  return placeFromApi(raw, groups)
}

// fields: a Place without id / updatedAt. Starts visible.
export async function createPlace(fields) {
  const groups = await getGroups()
  const created = await request(PLACES, {
    method: 'POST',
    body: placeToApi({ ...fields, visible: true }, null, groups),
  })
  return placeFromApi(created, groups)
}

export async function updatePlace(id, fields) {
  const [base, groups] = await Promise.all([getRawPlace(id), getGroups()])
  const updated = await request(`${PLACES}/${id}`, {
    method: 'PUT',
    body: placeToApi(fields, base, groups),
  })
  return placeFromApi(updated, groups)
}

// 백엔드 수정은 전체 교체라 지금 값을 받아 visible 만 바꿔 보낸다.
export async function setPlaceVisible(id, visible) {
  const base = await getRawPlace(id)
  await request(`${PLACES}/${id}`, {
    method: 'PUT',
    body: { ...placeDetailToApi(base), visible },
  })
}

// 회원 일정에 들어 있는 장소는 백엔드가 409 'PLACE_IN_USE' 로 거절한다
// (그 코드로 reject) — 삭제 대신 노출을 끈다.
export async function deletePlace(id) {
  await request(`${PLACES}/${id}`, { method: 'DELETE' })
}

// Korean address → { lat, lng, roadAddress, englishAddress, inSeoul } with
// the Naver Maps geocoder (Client ID only, in the browser — no backend
// needed). roadAddress: the Korean road address Naver matched;
// englishAddress: its English form ('' when Naver has none).
// Rejects with 'ADDRESS_NOT_FOUND', or 'GEOCODER_UNAVAILABLE' when the map
// script can't load.
export async function geocodeAddress(address) {
  let maps
  try {
    maps = await loadNaverGeocoder()
  } catch {
    throw new ApiError('GEOCODER_UNAVAILABLE')
  }
  const result = await new Promise((resolve) =>
    maps.Service.geocode({ query: address.trim() }, (status, response) =>
      resolve(
        status === maps.Service.Status.OK ? response.v2.addresses[0] : null,
      ),
    ),
  )
  if (!result) throw new ApiError('ADDRESS_NOT_FOUND')
  const roadAddress = result.roadAddress || result.jibunAddress
  return {
    lat: Number(Number(result.y).toFixed(6)),
    lng: Number(Number(result.x).toFixed(6)),
    roadAddress,
    englishAddress: result.englishAddress.replace(/, Republic of Korea$/, ''),
    inSeoul: roadAddress.startsWith('서울'),
  }
}

// --- Keywords (HC05) ---
// 백엔드에 어드민 키워드 API 가 없다: 읽기만 공개 API GET /api/v1/keywords
// (KeywordResponse { id, code, displayOrder }) 로 하고, 추가·수정·삭제·
// 순서 변경은 'NOT_SUPPORTED'. 키워드 id = code (장소의 keywordCodes).
// placeCount: 백엔드에 없음 → 0.
// GET /api/v1/keywords 는 아직 회원 로그인(JWT)이 필요해 어드민 키로는
// 401 이 온다. 그때는 장소 화면이 계속 열리도록 빈 목록을 준다 (장소에
// 붙은 키워드 코드는 그대로 유지·저장됨).

const KEYWORDS = '/api/v1/keywords'

// [{ ...keyword, placeCount }] in the HC05 order.
export async function getKeywords() {
  let raw
  try {
    raw = await request(KEYWORDS, { admin: false })
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      console.warn(
        '[keywords] GET /api/v1/keywords 가 로그인을 요구함 (백엔드 공개 경로 필요)',
      )
      return []
    }
    throw error
  }
  return [...raw]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(keywordFromApi)
}

const notSupported = () => Promise.reject(new ApiError('NOT_SUPPORTED'))

// fields: { name }. 백엔드에 없음.
export const createKeyword = notSupported
export const updateKeyword = notSupported
export const deleteKeyword = notSupported
export const reorderKeywords = notSupported
