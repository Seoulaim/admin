import { useState } from 'react'
import { Link } from 'react-router'
import Card from '../../components/Card.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import { nameMatches } from '../../lib/artists.js'
import { hoursSummary, operatingShort } from '../../lib/places.js'

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'visible', label: '노출 중' },
  { id: 'hidden', label: '숨김' },
]

// First photo, or a gray box of the same size when there's none or it
// fails to load.
function Thumbnail({ src, dimmed }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const sizeClass = 'h-11 w-[68px] shrink-0 rounded-md bg-chip'

  return src && src !== failedSrc ? (
    <img
      src={src}
      alt=""
      onError={() => setFailedSrc(src)}
      className={`${sizeClass} object-cover ${dimmed ? 'opacity-40' : ''}`}
    />
  ) : (
    <span aria-hidden="true" className={sizeClass} />
  )
}

// Left side of 장소 관리: search by place name (any language), group and
// visibility filters, and the places, newest edit first.
function PlaceList({ places, groups, selectedId }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [groupId, setGroupId] = useState(null)
  // A place is in a group when any of its tagged members is.
  const groupMembers = new Set(
    groups.find((g) => g.id === groupId)?.members.map((m) => m.id),
  )
  const shown = places.filter(
    (place) =>
      (filter === 'all' || place.visible === (filter === 'visible')) &&
      (!groupId || place.memberIds.some((id) => groupMembers.has(id))) &&
      (!query.trim() || nameMatches(place.name, query)),
  )
  const chip = (active) =>
    `h-7 shrink-0 rounded-full px-3 text-xs font-semibold ${active ? 'bg-text text-white' : 'text-muted hover:bg-chip'}`

  return (
    <Card className="flex max-h-[calc(100dvh-10rem)] flex-col overflow-hidden lg:sticky lg:top-20">
      <div className="flex flex-col gap-2 border-b border-border p-3">
        <input
          type="search"
          aria-label="장소 검색"
          placeholder="장소명 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={`${inputClass} h-10`}
        />
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={chip(filter === f.id)}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-sub">{shown.length}곳</span>
        </div>
        <div
          role="group"
          aria-label="그룹으로 거르기"
          className="flex flex-wrap gap-1 border-t border-border pt-2"
        >
          {[{ id: null, name: { en: '모든 그룹' } }, ...groups].map((group) => (
            <button
              key={group.id ?? 'all'}
              type="button"
              aria-pressed={groupId === group.id}
              onClick={() => setGroupId(group.id)}
              className={chip(groupId === group.id)}
            >
              {group.name.en}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-sub">
          찾는 장소가 없어요.
        </p>
      ) : (
        <ul className="flex-1 divide-y divide-border overflow-y-auto">
          {shown.map((place) => (
            <li key={place.id}>
              <Link
                to={`/places/${place.id}`}
                aria-current={place.id === selectedId ? 'true' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 ${place.id === selectedId ? 'bg-point-soft/60' : 'hover:bg-chip/60'}`}
              >
                <Thumbnail src={place.photos[0]} dimmed={!place.visible} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold">
                      {place.name.ko || place.name.en}
                    </span>
                    {!place.visible && (
                      <span className="shrink-0 rounded-full bg-chip px-1.5 text-[10px] font-bold text-sub">
                        숨김
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-sub">
                    멤버 {place.memberIds.length} · 키워드{' '}
                    {place.keywordIds.length} ·{' '}
                    {[
                      place.operating && operatingShort(place.operating),
                      hoursSummary(place.hours),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default PlaceList
