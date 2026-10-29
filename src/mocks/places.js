import { groups } from './artists.js'
import {
  keywords as legacyKeywords,
  places as legacyPlaces,
} from './legacyPlaces.js'

// Places and HC05 keywords for 장소 관리, moved from the member app.
// What it didn't have is left empty: Korean / Chinese / Japanese names and
// addresses, video links, breaks and closed days. A place tied to a whole
// group is now tagged with every member (tags are per member).

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const membersOf = (groupId) =>
  groups.find((g) => g.id === groupId)?.members.map((m) => m.id) ?? []

// The old single { open, close } becomes the same hours every day; open
// all day ('00:00'–'24:00') becomes "no opening hours".
function weekHours({ open, close }) {
  if (open === '00:00' && close === '24:00') return null
  return Object.fromEntries(
    DAYS.map((day) => [day, { open, close, breaks: [] }]),
  )
}

export const keywords = legacyKeywords.map(({ id, name }) => ({
  id,
  name: { en: name },
}))

export const places = legacyPlaces.map((place, i) => ({
  id: place.id,
  name: { en: place.name },
  topic: { en: place.topic },
  address: { en: place.address },
  lat: place.lat,
  lng: place.lng,
  naverMapUrl: place.mapUrl ?? '',
  phone: place.phone ?? '',
  website: place.website ?? '',
  videoUrls: [],
  photos: place.photos.slice(0, 5),
  memberIds: place.artistId ? [place.artistId] : membersOf(place.groupId),
  keywordIds: place.keywordIds,
  hours: weekHours(place.hours),
  visible: true,
  updatedAt: new Date(Date.now() - i * 36e5).toISOString(),
}))
