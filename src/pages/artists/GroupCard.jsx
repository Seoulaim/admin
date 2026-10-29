import { Link } from 'react-router'
import Avatar from '../../components/Avatar.jsx'
import { buttonClass } from '../../components/buttonClass.js'
import Card from '../../components/Card.jsx'
import MoveButtons from '../../components/MoveButtons.jsx'
import { allNames } from '../../lib/artists.js'
import { formatShortDate } from '../../lib/dates.js'

// One group: names, counts and, when open, its members in order.
// members: the ones to show (all, or the search matches).
// ordering (while reordering groups): { index, count, move(to), drag }.
function GroupCard({ group, members, open, onToggle, ordering }) {
  const details = [
    `멤버 ${group.members.length}명`,
    group.debutDate && `데뷔 ${formatShortDate(group.debutDate)}`,
    `최근 수정 ${formatShortDate(group.updatedAt)}`,
  ].filter(Boolean)

  return (
    <Card
      as="li"
      className={ordering ? 'cursor-grab active:cursor-grabbing' : ''}
    >
      <div {...ordering?.drag} className="flex items-center gap-4 p-4 sm:px-6">
        {ordering && (
          <span aria-hidden="true" className="text-lg leading-none text-line">
            ⋮⋮
          </span>
        )}
        <Avatar
          src={group.imageUrl}
          name={group.name.en}
          className="size-12 text-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold">
            {group.name.en}
            <span className="ml-2 text-sm font-medium text-muted">
              {allNames({ ...group.name, en: '' })}
            </span>
          </p>
          <p className="mt-0.5 truncate text-[13px] text-sub tabular-nums">
            {details.join(' · ')}
          </p>
        </div>
        {ordering ? (
          <MoveButtons
            index={ordering.index}
            count={ordering.count}
            onMove={ordering.move}
          />
        ) : (
          <>
            <Link
              to={`/artists/${group.id}/edit`}
              className={buttonClass('outline', 'sm')}
            >
              수정
            </Link>
            <button
              type="button"
              aria-expanded={open}
              aria-label={open ? '멤버 접기' : '멤버 펼치기'}
              onClick={onToggle}
              className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-chip"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                aria-hidden="true"
                className={`transition-transform ${open ? 'rotate-180' : ''}`}
              >
                <path
                  d="M3.5 6 8 10.5 12.5 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {open && !ordering && (
        <ol className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 border-t border-border p-4 sm:px-6">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-3 rounded-full border border-border py-1.5 pr-4 pl-1.5"
            >
              <Avatar src={member.imageUrl} name={member.name.en} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {member.name.en}
                  {member.name.ko && (
                    <span className="ml-1.5 font-medium text-muted">
                      {member.name.ko}
                    </span>
                  )}
                </p>
                <p className="text-xs text-sub tabular-nums">
                  {member.birthDate
                    ? `생일 ${formatShortDate(member.birthDate)}`
                    : '생일 미입력'}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

export default GroupCard
