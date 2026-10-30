import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { getRefundRequests } from '../../api/refunds.js'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import LoadError from '../../components/LoadError.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Toast from '../../components/Toast.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import { daysBetween, formatTimeAgo, todayKey } from '../../lib/dates.js'
import { formatKrw } from '../../lib/money.js'
import { REFUND_STATUS } from '../../lib/refunds.js'
import RefundDetail from './RefundDetail.jsx'

const TABS = [
  { id: 'requested', label: '처리 대기' },
  { id: 'refunded', label: '환불 완료' },
  { id: 'rejected', label: '거절' },
  { id: 'all', label: '전체' },
]

// 환불 관리: refund requests from the Help Center on the left (waiting ones
// first, closest deadline first), the one picked (/refunds/:requestId) on
// the right.
function RefundsPage() {
  const { requestId } = useParams()
  const { data: requests, error, reload, update } = useFetch(getRefundRequests)
  const { toast, showToast } = useToast()
  const [tab, setTab] = useState('requested')

  const shown = (requests ?? []).filter(
    (r) => tab === 'all' || r.refund.status === tab,
  )
  const count = (status) =>
    requests?.filter((r) => r.refund.status === status).length ?? 0
  const selected = requests?.find((r) => r.id === requestId)

  return (
    <>
      <PageHeader title="환불 관리" />
      <main className="p-4 sm:p-6 lg:p-8">
        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : !requests ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:gap-6">
            <Card className="flex max-h-[calc(100dvh-7rem)] flex-col overflow-hidden lg:sticky lg:top-20">
              <div
                role="tablist"
                className="flex gap-1 border-b border-border p-3"
              >
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={`h-8 flex-1 rounded-lg text-[13px] font-semibold whitespace-nowrap ${tab === t.id ? 'bg-point-soft text-point-strong' : 'text-muted hover:bg-chip'}`}
                  >
                    {t.label}
                    {t.id === 'requested' && ` ${count('requested')}`}
                  </button>
                ))}
              </div>
              {shown.length === 0 ? (
                <p className="py-16 text-center text-sm text-sub">
                  {tab === 'requested'
                    ? '처리할 환불 요청이 없어요.'
                    : '없어요.'}
                </p>
              ) : (
                <ul className="flex-1 divide-y divide-border overflow-y-auto">
                  {shown.map((r) => {
                    const waiting = r.refund.status === 'requested'
                    const daysLeft = daysBetween(todayKey(), r.deadline)
                    return (
                      <li key={r.id}>
                        <Link
                          to={`/refunds/${r.id}`}
                          aria-current={r.id === requestId ? 'true' : undefined}
                          className={`flex items-center gap-3 px-4 py-3 ${r.id === requestId ? 'bg-point-soft/60' : 'hover:bg-chip/60'}`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">
                              {r.author.nickname}
                              <span className="ml-2 font-medium text-muted tabular-nums">
                                {formatKrw(r.payment.amount)}
                              </span>
                            </p>
                            <p className="truncate text-xs text-sub">
                              {formatTimeAgo(r.createdAt)} 요청
                              {waiting &&
                                ` · 기한 ${daysLeft < 0 ? '지남' : daysLeft === 0 ? '오늘' : `D-${daysLeft}`}`}
                            </p>
                          </div>
                          {waiting ? (
                            <Chip
                              tone={
                                r.refundWithinPolicy
                                  ? 'bg-ok-soft text-ok'
                                  : 'bg-danger/10 text-danger'
                              }
                            >
                              {r.refundWithinPolicy ? '정책 안' : '정책 밖'}
                            </Chip>
                          ) : (
                            <Chip tone={REFUND_STATUS[r.refund.status].tone}>
                              {REFUND_STATUS[r.refund.status].label}
                            </Chip>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>

            {selected ? (
              <RefundDetail
                key={selected.id}
                request={selected}
                onToast={showToast}
                onChange={(next) =>
                  update((list) =>
                    list.map((r) => (r.id === next.id ? next : r)),
                  )
                }
              />
            ) : (
              <Card className="px-6 py-24 text-center text-sm text-sub">
                {requestId
                  ? '없는 환불 요청이에요.'
                  : '왼쪽에서 환불 요청을 고르세요.'}
              </Card>
            )}
          </div>
        )}
      </main>
      <Toast toast={toast} />
    </>
  )
}

export default RefundsPage
