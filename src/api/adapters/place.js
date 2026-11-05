import { ALWAYS_OPEN, DAYS } from '../../lib/places.js'
import { imageUrlFromKey, keyForUrl } from './image.js'

// 백엔드 AdminPlaceDetailResponse ↔ 화면의 Place (api/places.js 참고).
//
// 백엔드 (develop, PR #53 이후): { id, name, summary, category, visible,
//   address, district, location: { latitude, longitude }, avgStayMinutes,
//   phone, homepageUrl, naverMapUrl, referenceLinks, imageKeys,
//   operatingPeriod, openingHours, keywordCodes,
//   artists: [{ artistGroupId, artistId, description, … }], updatedAt }
//   name·summary·address 는 LocalizedText { en, ko, ja, zh } (빈 언어 null).
//
// - name ↔ name, topic ↔ summary, address ↔ address: 4개 언어 1:1.
//   읽을 때 null → '', 쓸 때 빈 칸 → null. 필수: name·summary 는 en,
//   address 는 ko·en (화면 검증과 같음).
// - category: 화면 입력이 없어 기존 값 유지, 새 장소는 FANDOM_PLACE.
// - district: 한국어 주소의 '…구' 를 뽑고, 못 뽑으면 기존 값.
// - naverMapUrl ↔ naverMapUrl, videoUrls ↔ referenceLinks (최대 5개).
// - photos ↔ imageKeys (업로드 domain PLACE, 첫 장이 대표).
// - memberIds ↔ artists: 그룹 단위 연결(artistId null)은 그 그룹 멤버
//   전원으로 펼친다. 쓸 때 원래 그룹 단위였던 그룹의 멤버가 모두 남아
//   있으면 그룹 단위로 되돌리고, description 은 이어받는다.
// - keywordIds ↔ keywordCodes (화면의 키워드 id = code).
// - hours ↔ openingHours: hoursToApi 위 규칙 참고. 휴무는 closed, 브레이크는
//   앞 1개, 자정 넘김·00:00 은 그대로, 24:00 만 00:00 으로.
// - operating ↔ operatingPeriod (AdminPlaceOperatingPeriod
//   { startsOn, endsOn }, 'YYYY-MM-DD', 당일 포함). null = 상시 운영
//   ↔ { always: true }. 기간이면 { always: false, startDate, endDate }.
// - avgStayMinutes: 화면에 없음 → 기존 값 유지(새 장소는 백엔드 기본 60분).

export const DEFAULT_CATEGORY = 'FANDOM_PLACE'

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const MIDNIGHT = '00:00' // 24:00 은 백엔드에서 00:00 (다음 날 자정 마감)
const MINUTES_PER_DAY = 24 * 60

// LocalizedText { en, ko, ja, zh } (빈 언어 null) ↔ 화면 { en, ko, zh, ja }.
export const textFromApi = (text) => ({
  en: text?.en ?? '',
  ko: text?.ko ?? '',
  zh: text?.zh ?? '',
  ja: text?.ja ?? '',
})

export const textToApi = (text) => {
  const value = (lang) => (text?.[lang] ?? '').trim() || null
  return { en: value('en'), ko: value('ko'), ja: value('ja'), zh: value('zh') }
}

// ---------- 읽기 ----------

const operatingFromApi = (period) =>
  period
    ? { always: false, startDate: period.startsOn, endDate: period.endsOn }
    : { ...ALWAYS_OPEN }

const operatingToApi = (operating) =>
  operating.always
    ? null
    : { startsOn: operating.startDate, endsOn: operating.endDate }

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
    name: textFromApi(raw.name),
    topic: textFromApi(raw.summary),
    address: textFromApi(raw.address),
    lat: raw.location?.latitude ?? null,
    lng: raw.location?.longitude ?? null,
    naverMapUrl: raw.naverMapUrl ?? '',
    phone: raw.phone ?? '',
    website: raw.homepageUrl ?? '',
    videoUrls: raw.referenceLinks ?? [],
    photos: (raw.imageKeys ?? []).map(imageUrlFromKey),
    memberIds: memberIdsFromApi(raw.artists, groups),
    keywordIds: raw.keywordCodes ?? [],
    operating: operatingFromApi(raw.operatingPeriod),
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
  const address = textToApi(fields.address)
  return {
    name: textToApi(fields.name),
    summary: textToApi(fields.topic),
    category: base?.category ?? DEFAULT_CATEGORY,
    visible: fields.visible ?? base?.visible ?? true,
    address,
    district: districtOf(address.ko ?? '') ?? base?.district ?? null,
    location: { latitude: fields.lat, longitude: fields.lng },
    avgStayMinutes: base?.avgStayMinutes ?? null,
    phone: fields.phone?.trim() || null,
    homepageUrl: fields.website?.trim() || null,
    naverMapUrl: fields.naverMapUrl?.trim() || null,
    referenceLinks: (fields.videoUrls ?? [])
      .map((url) => url.trim())
      .filter(Boolean),
    imageKeys: (fields.photos ?? []).map(keyForUrl).filter(Boolean),
    operatingPeriod: fields.operating
      ? operatingToApi(fields.operating)
      : (base?.operatingPeriod ?? null),
    openingHours: hoursToApi(fields.hours),
    keywordCodes: fields.keywordIds ?? [],
    artists: artistsToApi(fields.memberIds ?? [], base?.artists ?? [], groups),
  }
}

// 상세(raw)를 그대로 다시 보낼 요청으로 (노출만 바꿀 때).
export function placeDetailToApi(raw) {
  return {
    name: raw.name,
    summary: raw.summary,
    category: raw.category,
    visible: raw.visible,
    address: raw.address,
    district: raw.district,
    location: raw.location,
    avgStayMinutes: raw.avgStayMinutes,
    phone: raw.phone,
    homepageUrl: raw.homepageUrl,
    naverMapUrl: raw.naverMapUrl,
    referenceLinks: raw.referenceLinks ?? [],
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

// AdminKeywordResponse { id(UUID), code, name: LocalizedText, displayOrder,
// placeCount } → 화면 Keyword { id: code, name, placeCount }.
// 화면의 키워드 id 는 장소 keywordIds(= 백엔드 keywordCodes)와 맞추려고
// code 를 쓴다. 수정·삭제·순서 변경에 필요한 UUID 는 api/places.js 가
// code → UUID 로 바꿔 보낸다.
export const keywordFromApi = (raw) => ({
  id: raw.code,
  name: textFromApi(raw.name),
  placeCount: raw.placeCount ?? 0,
})

// AdminKeywordRequest { code?, name }. code 는 생략 → 백엔드가 영어 이름으로
// 만든다 (예: "Night View" → NIGHT_VIEW). 수정 때는 백엔드가 code 를 무시.
export const keywordToApi = (fields) => ({ name: textToApi(fields.name) })
