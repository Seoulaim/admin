import { Link } from 'react-router'
import Button from '../../components/Button.jsx'
import { buttonClass } from '../../components/buttonClass.js'
import Card from '../../components/Card.jsx'
import { formatLongDate, formatShortDate } from '../../lib/dates.js'
import {
  calendarDays,
  groupNames,
  isEvent,
  PERIOD_LABELS,
  periodStatus,
  pickText,
  tagClass,
} from '../../lib/events.js'

const PERIOD_TONES = {
  ongoing: 'bg-ok-soft text-ok',
  upcoming: 'bg-info-soft text-info',
  ended: 'bg-chip text-sub',
}

// Not ended first (soonest start first), then ended ones (latest first).
function byPeriod(items) {
  const ended = (item) => periodStatus(item) === 'ended'
  return [...items].sort((a, b) =>
    ended(a) !== ended(b)
      ? ended(a)
        ? 1
        : -1
      : ended(a)
        ? b.startDate.localeCompare(a.startDate)
        : a.startDate.localeCompare(b.startDate),
  )
}

function Row({ image, imageClass, children, chip, editUrl, onDelete, dim }) {
  return (
    <li
      className={`flex items-center gap-3 px-4 py-3 sm:px-5 ${dim ? 'bg-panel/60' : ''}`}
    >
      {image !== undefined && (
        <img
          src={image}
          alt=""
          className={`shrink-0 rounded-md bg-chip object-cover ${imageClass} ${dim ? 'opacity-50' : ''}`}
        />
      )}
      <div className="min-w-0 flex-1">{children}</div>
      {chip}
      <div className="flex shrink-0 gap-1.5">
        <Link to={editUrl} className={buttonClass('outline', 'sm')}>
          수정
        </Link>
        <Button size="sm" variant="danger" onClick={onDelete}>
          삭제
        </Button>
      </div>
    </li>
  )
}

function PeriodChip({ item }) {
  const status = periodStatus(item)
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${PERIOD_TONES[status]}`}
    >
      {PERIOD_LABELS[status]}
    </span>
  )
}

const Empty = ({ children }) => (
  <p className="px-5 py-14 text-center text-sm text-sub">{children}</p>
)

// Right side of 이벤트 관리. tab: 'day' (the selected day on the fan
// calendar) | 'events' (Event coming up) | 'cafes' (Birthday cafe).
function EventsPanel({
  tab,
  onTab,
  selected,
  entries,
  cafes,
  groups,
  memberGroup,
  onDelete,
}) {
  const events = entries.filter(isEvent)
  const dayItems = calendarDays(entries)[selected] ?? []
  const tabs = [
    { id: 'day', label: formatLongDate(selected) },
    { id: 'events', label: `Event coming up ${events.length}` },
    { id: 'cafes', label: `생일카페 ${cafes.length}` },
  ]
  const addLink = {
    day: [`/events/new?date=${selected}`, '이 날 일정 추가'],
    events: ['/events/new?only=event', '이벤트 추가'],
    cafes: ['/events/cafes/new', '생일카페 추가'],
  }[tab]

  return (
    <Card className="overflow-hidden">
      <div role="tablist" className="flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === tab}
            onClick={() => onTab(t.id)}
            className={`-mb-px flex-1 truncate border-b-2 px-2 py-3.5 text-sm font-semibold ${t.id === tab ? 'border-point-strong text-text' : 'border-transparent text-sub hover:text-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex justify-end px-4 pt-3 sm:px-5">
        <Link to={addLink[0]} className={buttonClass('outline', 'sm')}>
          + {addLink[1]}
        </Link>
      </div>

      {tab === 'day' &&
        (dayItems.length === 0 ? (
          <Empty>이 날 팬캘린더에 보이는 항목이 없어요.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {dayItems.map((entry) => (
              <Row
                key={entry.id}
                editUrl={`/events/${entry.id}/edit`}
                onDelete={() => onDelete('entry', entry)}
              >
                <p className="flex items-center gap-2">
                  <span
                    className={`truncate rounded-[3px] px-1.5 py-0.5 text-[13px] font-medium ${tagClass(entry.color)}`}
                  >
                    {pickText(entry.title)}
                  </span>
                  {isEvent(entry) && (
                    <span className="shrink-0 rounded-full bg-info-soft px-2 py-0.5 text-[11px] font-bold text-info">
                      Event coming up
                    </span>
                  )}
                </p>
                <p className="mt-1 truncate text-xs text-sub">
                  {groupNames(entry.groupIds, groups)}
                </p>
              </Row>
            ))}
          </ul>
        ))}

      {tab === 'events' &&
        (events.length === 0 ? (
          <Empty>등록된 이벤트가 없어요.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {byPeriod(events).map((event) => (
              <Row
                key={event.id}
                image={event.imageUrl}
                imageClass="h-[52px] w-10"
                dim={periodStatus(event) === 'ended'}
                chip={<PeriodChip item={event} />}
                editUrl={`/events/${event.id}/edit?only=event`}
                onDelete={() => onDelete('entry', event)}
              >
                <p className="truncate text-sm font-bold">
                  {pickText(event.title)}
                </p>
                <p className="mt-0.5 truncate text-xs text-sub tabular-nums">
                  {formatShortDate(event.startDate)} ~{' '}
                  {formatShortDate(event.endDate)} · {pickText(event.venue)}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-sub">
                  <span className="truncate">
                    {groupNames(event.groupIds, groups)}
                  </span>
                  {event.inCalendar ? (
                    <span
                      className={`shrink-0 rounded-[3px] px-1.5 py-px text-[11px] font-semibold text-text ${tagClass(event.color)}`}
                    >
                      팬캘린더
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-[3px] border border-border px-1.5 py-px text-[11px] font-semibold text-sub">
                      팬캘린더 미표시
                    </span>
                  )}
                </p>
              </Row>
            ))}
          </ul>
        ))}

      {tab === 'cafes' &&
        (cafes.length === 0 ? (
          <Empty>등록된 생일카페가 없어요.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {byPeriod(cafes).map((cafe) => {
              const group = memberGroup(cafe.memberId)
              const member = group?.members.find((m) => m.id === cafe.memberId)
              return (
                <Row
                  key={cafe.id}
                  image={cafe.imageUrl}
                  imageClass="h-10 w-[70px]"
                  dim={periodStatus(cafe) === 'ended'}
                  chip={<PeriodChip item={cafe} />}
                  editUrl={`/events/cafes/${cafe.id}/edit`}
                  onDelete={() => onDelete('cafe', cafe)}
                >
                  <p className="truncate text-sm font-bold">
                    {pickText(cafe.venue)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-sub tabular-nums">
                    {member
                      ? `${member.name.en} (${group.name.en})`
                      : cafe.memberId}{' '}
                    · {formatShortDate(cafe.startDate)} ~{' '}
                    {formatShortDate(cafe.endDate)}
                  </p>
                </Row>
              )
            })}
          </ul>
        ))}
    </Card>
  )
}

export default EventsPanel
