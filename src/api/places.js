import { loadNaverGeocoder } from '../lib/naverMaps.js'
import { ApiError } from '../lib/apiClient.js'
import {
  keywordFromApi,
  keywordToApi,
  placeFromApi,
  placeToApi,
} from './adapters/place.js'
import { getGroups } from './artists.js'
import { request } from './client.js'

// Place: { id, name, topic, address, lat, lng, naverMapUrl, phone, website,
//   videoUrls, photos, memberIds, keywordIds, operating, hours, visible,
//   updatedAt }
// - name / topic: { en, ko, zh, ja } (en required).
// - address: { ko, en, zh, ja } — ko (what Geocoding reads) and en required.
// - lat / lng: the map pin, from geocodeAddress or dragged by the admin.
// - naverMapUrl: '' → the app links to a Naver Map search for the name.
// - videoUrls: up to 5 links (YouTube, …) showing why it's a fandom place.
// - photos: up to 5 image URLs, the first is the main one.
// - memberIds: tagged members (any groups, always per member — a place
//   for a whole group lists each member). keywordIds: HC05 keywords.
// - operating: { always: true } (상시 운영: 음식점·공연장) or
//   { always: false, startDate, endDate } ('YYYY-MM-DD', 당일 포함; 생일카페·
//   팝업처럼 기간이 정해진 곳). 상시면 startDate·endDate 는 ''.
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
// 이름·주제(summary)·주소는 4개 언어 1:1, videoUrls ↔ referenceLinks.
// 백엔드에 없는 것: 하루 2개 이상의 브레이크.

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

// 노출 전용 PATCH (다른 필드는 검증·변경하지 않음). 없는 장소는
// 'PLACE_NOT_FOUND' 로 reject.
export async function setPlaceVisible(id, visible) {
  await request(`${PLACES}/${id}/visible`, {
    method: 'PATCH',
    body: { visible },
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
// 백엔드 /api/v1/admin/keywords (AdminKeywordController, develop PR #53).
// 화면의 키워드 id 는 code (장소의 keywordCodes 와 같음). 수정·삭제·순서
// 변경은 백엔드가 UUID 를 받으므로 마지막으로 받은 목록의 code → UUID 로
// 바꿔 보낸다 (모르는 code 면 목록을 다시 받아 찾는다).
// - 추가: code 는 백엔드가 영어 이름으로 만든다. 같은 code 가 있으면 409
//   'PLACE_KEYWORD_DUPLICATED', 영어 이름에 영문·숫자가 없으면
//   'PLACE_KEYWORD_INVALID_CODE' 로 reject.
// - 삭제: 장소 연결도 함께 삭제된다.
// - 순서 변경: 전체 id 를 순서대로 (빠지면 'PLACE_KEYWORD_INVALID_ORDER').

const KEYWORDS = '/api/v1/admin/keywords'

const keywordUuids = new Map() // code → UUID

function rememberKeywords(items) {
  keywordUuids.clear()
  for (const item of items) keywordUuids.set(item.code, item.id)
  return items.map(keywordFromApi)
}

async function keywordUuid(code) {
  if (!keywordUuids.has(code)) rememberKeywords((await request(KEYWORDS)).items)
  const uuid = keywordUuids.get(code)
  if (!uuid) throw new ApiError('PLACE_KEYWORD_NOT_FOUND')
  return uuid
}

// [{ ...keyword, placeCount }] in the HC05 order (백엔드 displayOrder 순).
export async function getKeywords() {
  const { items } = await request(KEYWORDS)
  return rememberKeywords(items)
}

// fields: { name }. Added last.
export async function createKeyword(fields) {
  const created = await request(KEYWORDS, {
    method: 'POST',
    body: keywordToApi(fields),
  })
  keywordUuids.set(created.code, created.id)
  return keywordFromApi(created)
}

// fields: { name }. code(= id) 는 바뀌지 않는다.
export async function updateKeyword(id, fields) {
  const updated = await request(`${KEYWORDS}/${await keywordUuid(id)}`, {
    method: 'PUT',
    body: keywordToApi(fields),
  })
  return keywordFromApi(updated)
}

// Also takes it off every place.
export async function deleteKeyword(id) {
  await request(`${KEYWORDS}/${await keywordUuid(id)}`, { method: 'DELETE' })
  keywordUuids.delete(id)
}

// ids: every keyword id in the new order.
export async function reorderKeywords(ids) {
  const keywordIds = []
  for (const id of ids) keywordIds.push(await keywordUuid(id))
  const { items } = await request(`${KEYWORDS}/order`, {
    method: 'PUT',
    body: { keywordIds },
  })
  rememberKeywords(items)
}
