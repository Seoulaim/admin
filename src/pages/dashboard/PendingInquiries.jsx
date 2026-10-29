import { Link } from 'react-router'
import Card from '../../components/Card.jsx'
import { formatTimeAgo } from '../../lib/dates.js'
import { inquiryCategoryLabel } from '../../lib/inquiries.js'

const MAX_ROWS = 5

function PendingInquiries({ inquiries }) {
  return (
    <Card className="flex flex-col p-5 lg:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold">답변 대기 문의</h2>
        <Link
          to="/inquiries"
          className="text-sm font-medium text-sub hover:text-text"
        >
          전체 보기
        </Link>
      </div>
      {inquiries.length === 0 ? (
        <p className="py-10 text-center text-sm text-sub">
          답변할 문의가 없어요.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {inquiries.slice(0, MAX_ROWS).map((inquiry) => (
            <li key={inquiry.id}>
              <Link
                to={`/inquiries/${inquiry.id}`}
                className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-chip"
              >
                <span className="shrink-0 rounded-md bg-chip px-2 py-0.5 text-xs font-semibold text-muted">
                  {inquiryCategoryLabel(inquiry.category)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {inquiry.title}
                  </p>
                  <p className="truncate text-xs text-sub">
                    {inquiry.nickname} · {formatTimeAgo(inquiry.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn">
                  답변 대기
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default PendingInquiries
