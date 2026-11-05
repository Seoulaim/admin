import { Link } from 'react-router'
import Button from '../../components/Button.jsx'
import { buttonClass } from '../../components/buttonClass.js'
import MoveButtons from '../../components/MoveButtons.jsx'
import Switch from '../../components/Switch.jsx'
import { formatShortDate } from '../../lib/dates.js'
import { promotionStatus, STATUS_LABELS } from '../../lib/promotions.js'

const PLACEMENT_TONES = {
  HOME: 'bg-point-soft text-point-strong',
  DIARY: 'bg-diary-soft text-diary',
}

const STATUS_TONES = {
  always: 'bg-ok-soft text-ok',
  live: 'bg-ok-soft text-ok',
  scheduled: 'bg-info-soft text-info',
  off: 'bg-chip text-muted',
  ended: 'bg-chip text-sub',
}

function Chip({ className, children }) {
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center rounded-full px-3 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  )
}

// Either end can be open (null), e.g. a banner that was the default before
// another one took over keeps no period.
function periodLabel({ startDate, endDate }) {
  if (!startDate && !endDate) return '기간 없음 · 켜져 있으면 항상 게시'
  const start = startDate ? formatShortDate(startDate) : ''
  const end = endDate ? formatShortDate(endDate) : ''
  return `${start} ~ ${end}`.trim()
}

// One promotion. ordering (while reordering): { index, count, move(to),
// drag (useDragSort's row props) } — the row drags and shows up/down
// buttons instead of the switch and edit/delete.
function PromotionRow({
  promotion,
  showPlacement,
  ordering,
  onToggle,
  onDelete,
  onMakeDefault,
}) {
  const status = promotionStatus(promotion)
  const period = promotion.isDefault
    ? '기본 배너 · 기간 없이 항상 게시'
    : periodLabel(promotion)

  return (
    <li
      {...ordering?.drag}
      className={`flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:px-6 ${ordering ? 'cursor-grab bg-white active:cursor-grabbing' : ''} ${status === 'ended' && !ordering ? 'bg-panel/60' : ''}`}
    >
      {ordering && (
        <span aria-hidden="true" className="text-lg leading-none text-line">
          ⋮⋮
        </span>
      )}
      <img
        src={promotion.imageUrl}
        alt=""
        draggable={false}
        className={`aspect-[393/197] w-28 shrink-0 rounded-lg bg-chip object-cover ${status === 'ended' ? 'opacity-50' : ''}`}
      />
      <div className="min-w-0 flex-1 basis-48">
        <p className="truncate text-[15px] font-bold">{promotion.adminTitle}</p>
        <p className="mt-0.5 truncate text-[13px] text-sub tabular-nums">
          {period}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {showPlacement && (
          <Chip
            className={`w-[68px] justify-center ${PLACEMENT_TONES[promotion.placement]}`}
          >
            {promotion.placement}
          </Chip>
        )}
        <Chip className={`w-[72px] justify-center ${STATUS_TONES[status]}`}>
          {STATUS_LABELS[status]}
        </Chip>
      </div>

      {ordering ? (
        <div className="ml-auto">
          <MoveButtons
            index={ordering.index}
            count={ordering.count}
            onMove={ordering.move}
          />
        </div>
      ) : (
        <div className="ml-auto flex items-center gap-4">
          <span
            title={
              promotion.isDefault
                ? '기본 배너는 끌 수 없어요.'
                : status === 'ended'
                  ? '기간이 끝났어요. 다시 게시하려면 수정에서 종료일을 바꾸세요.'
                  : undefined
            }
          >
            <Switch
              checked={
                promotion.isDefault || (promotion.enabled && status !== 'ended')
              }
              onChange={onToggle}
              disabled={promotion.isDefault || status === 'ended'}
              label={`${promotion.adminTitle} 게시`}
            />
          </span>
          <div className="flex gap-2">
            {/* The default row keeps the button's room so the chips line up. */}
            <Button
              size="sm"
              onClick={onMakeDefault}
              aria-hidden={promotion.isDefault || undefined}
              tabIndex={promotion.isDefault ? -1 : undefined}
              disabled={promotion.isDefault}
              className={promotion.isDefault ? 'invisible' : ''}
            >
              기본으로 설정
            </Button>
            <Link
              to={`/promotions/${promotion.id}/edit`}
              className={buttonClass('outline', 'sm')}
            >
              수정
            </Link>
            <Button
              size="sm"
              variant="danger"
              onClick={onDelete}
              disabled={promotion.isDefault}
              title={
                promotion.isDefault
                  ? '기본 배너는 삭제할 수 없어요.'
                  : undefined
              }
            >
              삭제
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}

export default PromotionRow
