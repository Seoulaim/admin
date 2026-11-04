import { DAYS } from '../../lib/places.js'
import { imageUrlFromKey, keyForUrl } from './image.js'

// 백엔드 AdminPlaceDetailResponse ↔ 화면의 Place (api/places.js 참고).
//
// 백엔드: { id, name, category, visible, address, district,
//   location: { latitude, longitude }, avgStayMinutes, phone, homepageUrl,
//   imageKeys, operatingPeriod, openingHours, keywordCodes,
//   artists: [{ artistGroupId, artistId, description, … }], updatedAt }
//
// - name: 백엔드는 문자열 하나(시드는 한국어). 읽을 때 en·ko 둘 다 그 값,
//   쓸 때는 기존 값에서 바뀐 칸(ko 우선), 새 장소는 ko || en.
// - topic: 백엔드에 없음 → category 라벨로 채움(필수 검증 통과용), 쓸 때
//   버림. category 는 화면 입력이 없어 기존 값 유지, 새 장소는 FANDOM_PLACE.
// - address: 백엔드는 하나 → ko 를 저장. 읽을 때 ko·en 둘 다 그 값.
//   district 는 주소의 '…구' 를 뽑고, 못 뽑으면 기존 값.
// - photos ↔ imageKeys (업로드 domain PLACE, 첫 장이 대표).
// - memberIds ↔ artists: 그룹 단위 연결(artistId null)은 그 그룹 멤버
//   전원으로 펼친다. 쓸 때 원래 그룹 단위였던 그룹의 멤버가 모두 남아
//   있으면 그룹 단위로 되돌리고, description 은 이어받는다.
// - keywordIds ↔ keywordCodes (키워드 id = code).
// - hours ↔ openingHours: hoursToApi 위 규칙 참고. 휴무는 closed, 브레이크는
//   앞 1개, 자정 넘김·00:00 은 그대로, 24:00 만 00:00 으로.
// - naverMapUrl·videoUrls: 백엔드에 없음 → ''·[] (쓸 때 버림).
// - avgStayMinutes·operatingPeriod: 화면에 없음 → 기존 값 유지(새 장소는
//   백엔드 기본: 60분, 상시 운영).

export const DEFAULT_CATEGORY = 'FANDOM_PLACE'

const CATEGORY_TOPICS = {
  FANDOM_PLACE: { en: 'Fandom place', ko: '팬덤 장소' },
  GOODS_SHOP: { en: 'Goods shop', ko: '굿즈숍' },
  ALBUM_SHOP: { en: 'Album shop', ko: '음반 매장' },
  PHOTO_BOOTH: { en: 'Photo booth', ko: '포토부스' },
  ATTRACTION: { en: 'Attraction', ko: '명소' },
}

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const MIDNIGHT = '00:00' // 24:00 은 백엔드에서 00:00 (다음 날 자정 마감)
const MINUTES_PER_DAY = 24 * 60

const both = (text) => ({ en: text ?? '', ko: text ?? '', zh: '', ja: '' })

// ---------- 읽기 ----------

function hoursFromApi(openingHours) {
  if (!openingHours) return null
  const byDay = new Map(openingHours.map((h) => [h.dayOfWeek, h]))
  return Object.fromEntries(
    DAYS.map((day, i) => {
      const hour = byDay.get(WEEKDAYS[i])
      if (!hour || hour.closed) return [day.id, null]
      return [
        day.id,
        {
          open: hour.opensAt,
          close: hour.closesAt,
          breaks: hour.breakStartsAt
            ? [{ start: hour.breakStartsAt, end: hour.breakEndsAt }]
            : [],
        },
      ]
    }),
  )
}

function memberIdsFromApi(artists, groups) {
  const ids = []
  for (const link of artists ?? []) {
    if (link.artistId) ids.push(link.artistId)
    else {
      const group = groups.find((g) => g.id === link.artistGroupId)
      ids.push(...(group?.members.map((m) => m.id) ?? []))
    }
  }
  return [...new Set(ids)]
}

// groups: 화면 형태의 그룹 목록 (api/artists.js getGroups).
export function placeFromApi(raw, groups) {
  return {
    id: raw.id,
    name: both(raw.name),
    topic: {
      zh: '',
      ja: '',
      ...(CATEGORY_TOPICS[raw.category] ?? CATEGORY_TOPICS[DEFAULT_CATEGORY]),
    },
    address: both(raw.address),
    lat: raw.location?.latitude ?? null,
    lng: raw.location?.longitude ?? null,
    naverMapUrl: '',
    phone: raw.phone ?? '',
    website: raw.homepageUrl ?? '',
    videoUrls: [],
    photos: (raw.imageKeys ?? []).map(imageUrlFromKey),
    memberIds: memberIdsFromApi(raw.artists, groups),
    keywordIds: raw.keywordCodes ?? [],
    hours: hoursFromApi(raw.openingHours),
    visible: raw.visible,
    updatedAt: raw.updatedAt ?? '',
  }
}

// ---------- 쓰기 ----------

// 백엔드 검증 (AdminPlaceService.isValidOpeningHours, develop 기준):
// - openingHours null = 영업시간 없음. 있으면 MON~SUN 정확히 7개, 요일 중복 X
// - 휴무: closed true + 시각 4개 모두 null
// - 영업: opensAt·closesAt 필수. closesAt ≤ opensAt 이면 다음 날 closesAt 까지
//   (자정 넘김), 같으면 24시간. 24:00 = 00:00
// - 브레이크: 하루 최대 1개, 시작·끝 둘 다 있거나 둘 다 없음, 여는 시각부터
//   지난 분으로 0 < 시작 < 끝 < 영업 길이 (자정을 걸쳐도 구간 안이면 OK)
// - 시각 형식 'HH:mm'
const MAX_BREAKS = 1
const hhmm = (time) => (time ?? '').slice(0, 5)
const minuteOf = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
// 여는 시각부터 time 까지 지난 분 (자정을 넘기면 다음 날로).
const offset = (opensAt, time) =>
  (((minuteOf(time) - minuteOf(opensAt)) % MINUTES_PER_DAY) + MINUTES_PER_DAY) %
  MINUTES_PER_DAY

// 백엔드 OpeningHours.isValid 와 같은 브레이크 범위 검사.
function breakInside(opensAt, closesAt, start, end) {
  const length = offset(opensAt, closesAt) || MINUTES_PER_DAY
  const s = offset(opensAt, start)
  const e = offset(opensAt, end)
  return 0 < s && s < e && e < length
}

function dayToApi(dayOfWeek, value, label) {
  if (!value) {
    return {
      dayOfWeek,
      closed: true,
      opensAt: null,
      closesAt: null,
      breakStartsAt: null,
      breakEndsAt: null,
    }
  }
  const opensAt = hhmm(value.open)
  // 자정 넘김(close <= open)·00:00 은 그대로, 24:00 만 00:00 으로.
  const close = hhmm(value.close)
  const closesAt = close === '24:00' ? MIDNIGHT : close
  const breaks = value.breaks ?? []
  if (breaks.length > MAX_BREAKS) {
    console.warn(
      `[place hours] ${label} 브레이크 ${breaks.length}개 중 앞 ${MAX_BREAKS}개만 저장`,
    )
  }
  let pause = breaks[0] ?? null
  if (pause) {
    const start = hhmm(pause.start) === '24:00' ? MIDNIGHT : hhmm(pause.start)
    const end = hhmm(pause.end) === '24:00' ? MIDNIGHT : hhmm(pause.end)
    if (start && end && breakInside(opensAt, closesAt, start, end)) {
      pause = { start, end }
    } else {
      console.warn(
        `[place hours] ${label} 브레이크 ${start}~${end} 가 영업시간 ${opensAt}~${closesAt} 밖이라 저장하지 않음`,
      )
      pause = null
    }
  }
  return {
    dayOfWeek,
    closed: false,
    opensAt,
    closesAt,
    breakStartsAt: pause?.start ?? null,
    breakEndsAt: pause?.end ?? null,
  }
}

export function hoursToApi(hours) {
  if (!hours) return null
  return DAYS.map((day, i) => dayToApi(WEEKDAYS[i], hours[day.id], day.label))
}

// 기존 값(current)과 다른 칸을 고른다: ko 우선, 그다음 en.
function pickText(localized, current) {
  const ko = (localized?.ko ?? '').trim()
  const en = (localized?.en ?? '').trim()
  if (current == null) return ko || en
  if (ko && ko !== current) return ko
  if (en && en !== current) return en
  return current
}

const districtOf = (address) =>
  address.match(/(?:^|\s)(\S+구)(?=\s|$)/)?.[1] ?? null

function artistsToApi(memberIds, baseLinks, groups) {
  const groupOf = new Map()
  for (const group of groups) {
    for (const member of group.members) groupOf.set(member.id, group)
  }
  const selected = new Set(memberIds)
  const covered = new Set()
  const links = []

  for (const link of baseLinks.filter((l) => !l.artistId)) {
    const group = groups.find((g) => g.id === link.artistGroupId)
    if (!group || !group.members.every((m) => selected.has(m.id))) continue
    group.members.forEach((m) => covered.add(m.id))
    links.push({
      artistGroupId: group.id,
      artistId: null,
      description: link.description ?? null,
    })
  }
  for (const id of memberIds) {
    const group = groupOf.get(id)
    if (covered.has(id) || !group) continue
    links.push({
      artistGroupId: group.id,
      artistId: id,
      description:
        baseLinks.find((l) => l.artistId === id)?.description ?? null,
    })
  }
  return links
}

// AdminPlaceRequest (등록·수정 공용, 전체 교체).
// base: 지금 서버에 있는 상세(raw), 새 장소면 null. groups: 화면 형태.
export function placeToApi(fields, base, groups) {
  const address = (fields.address?.ko ?? '').trim()
  return {
    name: pickText(fields.name, base?.name),
    category: base?.category ?? DEFAULT_CATEGORY,
    visible: fields.visible ?? base?.visible ?? true,
    address: address || null,
    district: districtOf(address) ?? base?.district ?? null,
    location: { latitude: fields.lat, longitude: fields.lng },
    avgStayMinutes: base?.avgStayMinutes ?? null,
    phone: fields.phone?.trim() || null,
    homepageUrl: fields.website?.trim() || null,
    imageKeys: (fields.photos ?? []).map(keyForUrl).filter(Boolean),
    operatingPeriod: base?.operatingPeriod ?? null,
    openingHours: hoursToApi(fields.hours),
    keywordCodes: fields.keywordIds ?? [],
    artists: artistsToApi(fields.memberIds ?? [], base?.artists ?? [], groups),
  }
}

// 상세(raw)를 그대로 다시 보낼 요청으로 (노출만 바꿀 때).
export function placeDetailToApi(raw) {
  return {
    name: raw.name,
    category: raw.category,
    visible: raw.visible,
    address: raw.address,
    district: raw.district,
    location: raw.location,
    avgStayMinutes: raw.avgStayMinutes,
    phone: raw.phone,
    homepageUrl: raw.homepageUrl,
    imageKeys: raw.imageKeys ?? [],
    operatingPeriod: raw.operatingPeriod,
    openingHours: raw.openingHours,
    keywordCodes: raw.keywordCodes ?? [],
    artists: (raw.artists ?? []).map(
      ({ artistGroupId, artistId, description }) => ({
        artistGroupId,
        artistId,
        description,
      }),
    ),
  }
}

// ---------- 키워드 ----------

// KeywordResponse { id, code, displayOrder } → { id: code, name, placeCount }.
// 표시 문구는 회원 앱이 code 로 번역하므로 이름은 code 그대로.
export const keywordFromApi = (raw) => ({
  id: raw.code,
  name: { en: raw.code, ko: '', zh: '', ja: '' },
  placeCount: 0,
})
