import { loadNaverGeocoder } from '../lib/naverMaps.js'
import { keywords, places } from '../mocks/places.js'
import { ApiError, handle } from '../mocks/server.js'

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

function finder(list) {
  return (id) => {
    const item = list.find((i) => i.id === id)
    if (!item) throw new ApiError('NOT_FOUND')
    return item
  }
}
const findPlace = finder(places)
const findKeyword = finder(keywords)

// Newest edit first.
export function getPlaces() {
  return handle(() =>
    [...places].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  )
}

// Rejects with 'NOT_FOUND'.
export function getPlace(id) {
  return handle(() => findPlace(id))
}

// fields: a Place without id / updatedAt. Starts visible.
export function createPlace(fields) {
  return handle(() => {
    const place = {
      ...fields,
      id: `pl-${Date.now()}`,
      visible: true,
      updatedAt: new Date().toISOString(),
    }
    places.push(place)
    return place
  })
}

export function updatePlace(id, fields) {
  return handle(() => {
    const place = findPlace(id)
    Object.assign(place, fields, { updatedAt: new Date().toISOString() })
    return place
  })
}

export function setPlaceVisible(id, visible) {
  return handle(() => {
    findPlace(id).visible = visible
  })
}

// Members' saved plans that include it lose it (the backend drops it from
// them), so the screen asks to turn it off (visible) first.
export function deletePlace(id) {
  return handle(() => {
    places.splice(places.indexOf(findPlace(id)), 1)
  })
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

// [{ ...keyword, placeCount }] in the HC05 order.
export function getKeywords() {
  return handle(() =>
    keywords.map((keyword) => ({
      ...keyword,
      placeCount: places.filter((p) => p.keywordIds.includes(keyword.id))
        .length,
    })),
  )
}

// fields: { name }. Added last.
export function createKeyword(fields) {
  return handle(() => {
    const keyword = { ...fields, id: `kw-${Date.now()}` }
    keywords.push(keyword)
    return keyword
  })
}

export function updateKeyword(id, fields) {
  return handle(() => Object.assign(findKeyword(id), fields))
}

// Also takes it off every place.
export function deleteKeyword(id) {
  return handle(() => {
    keywords.splice(keywords.indexOf(findKeyword(id)), 1)
    for (const place of places) {
      place.keywordIds = place.keywordIds.filter((k) => k !== id)
    }
  })
}

// ids: every keyword id in the new order.
export function reorderKeywords(ids) {
  return handle(() => {
    keywords.splice(0, keywords.length, ...ids.map(findKeyword))
  })
}
