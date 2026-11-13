import { Link } from 'react-router'
import Card from '../../components/Card.jsx'
import { formatTimeAgo } from '../../lib/dates.js'
import { formatMoney } from '../../lib/money.js'

const MAX_ROWS = 5

// Refund inquiries waiting to be handled. Members can only ask within the
// refund period, so every one here was asked in time.
function PendingRefunds({ refunds }) {
  return (
    <Card className="flex flex-col p-5 lg:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold">처리 대기 환불</h2>
        <Link
          to="/refunds"
          className="text-sm font-medium text-sub hover:text-text"
        >
          전체 보기
        </Link>
      </div>
      {refunds.length === 0 ? (
        <p className="py-10 text-center text-sm text-sub">
          처리할 환불 요청이 없어요.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {refunds.slice(0, MAX_ROWS).map((refund) => (
            <li key={refund.id}>
              <Link
                to={`/refunds/${refund.id}`}
                className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-chip"
              >
                <span className="shrink-0 rounded-md bg-chip px-2 py-0.5 text-xs font-semibold text-muted tabular-nums">
                  {refund.amount == null
                    ? '—'
                    : formatMoney(refund.amount, refund.currency ?? 'KRW')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {refund.title}
                  </p>
                  <p className="truncate text-xs text-sub">
                    {refund.nickname ?? '—'} · {formatTimeAgo(refund.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn">
                  처리 대기
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default PendingRefunds
