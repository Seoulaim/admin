import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  getAllPayments,
  getPayment,
  getPayments,
  PAGE_SIZE,
} from '../../api/payments.js'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import DateRangeFilter from '../../components/form/DateRangeFilter.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import LoadError from '../../components/LoadError.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { useFetch } from '../../hooks/useFetch.js'
import {
  formatDateTime,
  formatShortDate,
  seoulDateKey,
} from '../../lib/dates.js'
import { formatKrw } from '../../lib/money.js'
import PaymentDetail from './PaymentDetail.jsx'
import { PAYMENT_STATUS, PAYMENT_STATUS_FILTERS } from './paymentStatus.js'

// 결제 전(pending·failed)이면 paidAt 이 없어 만든 시각을 쓴다.
const shownAt = (p) => p.paidAt ?? p.createdAt

// Payments in range as CSV (Excel opens it as UTF-8 thanks to the BOM),
// for checking against Toss Payments.
function downloadCsv(rows) {
  const header = [
    '결제 시각',
    '주문번호',
    '회원 ID',
    '닉네임',
    '이메일',
    '다이어리',
    '금액',
    '상태',
  ]
  const lines = rows.map((p) => [
    formatDateTime(shownAt(p)),
    p.orderId,
    p.member.id,
    p.member.nickname,
    p.member.email,
    p.diary.name ?? '(삭제됨)',
    p.amount,
    PAYMENT_STATUS[p.status].label,
  ])
  const csv = [header, ...lines]
    .map((line) =>
      line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','),
    )
    .join('\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `seoulaim-payments.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// 결제 관리: diary payments with date / status filters and search (on the
// server, a page at a time), totals for the filters, CSV for Toss
// reconciliation; the one picked (/payments/:paymentId) on the right.
function PaymentsPage() {
  const { paymentId } = useParams()
  const [range, setRange] = useState({ from: '', to: '' })
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [exporting, setExporting] = useState(false)
  const debounced = useDebouncedValue(query, 250)
  const filters = { status, q: debounced, from: range.from, to: range.to }
  const fetcher = useCallback(
    () => getPayments({ status, q: debounced, ...range, page }),
    [status, debounced, range, page],
  )
  const { data, error, reload } = useFetch(fetcher)
  const payments = data?.items
  const summary = data?.summary
  const pageCount = data
    ? Math.max(1, Math.ceil(data.totalElements / PAGE_SIZE))
    : 1
  const chip = (active) =>
    `h-7 rounded-full px-3 text-xs font-semibold ${active ? 'bg-text text-white' : 'text-muted hover:bg-chip'}`

  async function exportCsv() {
    setExporting(true)
    try {
      downloadCsv(await getAllPayments(filters))
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <PageHeader title="결제 관리">
        <Button
          onClick={exportCsv}
          disabled={exporting || !data || data.totalElements === 0}
        >
          {exporting ? '내보내는 중…' : 'CSV 내보내기'}
        </Button>
      </PageHeader>
      <main className="flex flex-col gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8">
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <DateRangeFilter
              value={range}
              onChange={(value) => {
                setRange(value)
                setPage(0)
              }}
            />
            <input
              type="search"
              aria-label="결제 검색"
              placeholder="닉네임·이메일·주문번호"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(0)
              }}
              className={`${inputClass} h-9 max-w-xs lg:ml-auto`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1">
              <span className="mr-1 text-xs font-bold text-sub">상태</span>
              {PAYMENT_STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setStatus(f.id)
                    setPage(0)
                  }}
                  className={chip(status === f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3 text-sm tabular-nums">
            {summary ? (
              <>
                <span>
                  결제 <b>{summary.paidCount}건</b>{' '}
                  {formatKrw(summary.paidAmount)}
                </span>
                <span className="text-muted">
                  환불 {summary.refundedCount}건{' '}
                  {formatKrw(summary.refundedAmount)}
                </span>
                <span>
                  순매출{' '}
                  <b className="text-point-strong">
                    {formatKrw(summary.paidAmount)}
                  </b>
                </span>
                <span className="text-xs text-sub">
                  기간·검색어 기준 합계 (상태 필터와 무관)
                </span>
              </>
            ) : (
              <span className="text-sub">합계 불러오는 중…</span>
            )}
          </div>
        </Card>

        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : !payments ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,400px)_minmax(0,1fr)] lg:gap-6">
            <Card className="flex max-h-[calc(100dvh-7rem)] flex-col overflow-hidden lg:sticky lg:top-20">
              {payments.length === 0 ? (
                <p className="py-16 text-center text-sm text-sub">
                  조건에 맞는 결제가 없어요.
                </p>
              ) : (
                <ul className="flex-1 divide-y divide-border overflow-y-auto">
                  {payments.map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/payments/${p.id}`}
                        aria-current={p.id === paymentId ? 'true' : undefined}
                        className={`flex items-center gap-3 px-4 py-3 ${p.id === paymentId ? 'bg-point-soft/60' : 'hover:bg-chip/60'}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">
                            {p.member.nickname}
                            <span className="ml-2 font-medium text-muted tabular-nums">
                              {formatKrw(p.amount)}
                            </span>
                          </p>
                          <p className="truncate text-xs text-sub tabular-nums">
                            {formatDateTime(shownAt(p))} ·{' '}
                            {p.diary.name ?? '(삭제됨)'}
                            {p.diary.completedAt && ' · 완성'}
                          </p>
                          {p.editedAt && (
                            <p className="truncate text-xs text-sub tabular-nums">
                              결제 후 편집{' '}
                              {formatShortDate(seoulDateKey(p.editedAt))}
                            </p>
                          )}
                        </div>
                        {p.sameDiaryPayments > 0 && (
                          <Chip tone="bg-danger/10 text-danger">중복?</Chip>
                        )}
                        <Chip tone={PAYMENT_STATUS[p.status].tone}>
                          {PAYMENT_STATUS[p.status].label}
                        </Chip>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2 text-xs text-sub tabular-nums">
                <span>
                  전체 {data.totalElements}건 · {page + 1}/{pageCount}쪽
                </span>
                <span className="flex gap-1">
                  <Button
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    이전
                  </Button>
                  <Button
                    size="sm"
                    disabled={page + 1 >= pageCount}
                    onClick={() => setPage(page + 1)}
                  >
                    다음
                  </Button>
                </span>
              </div>
            </Card>

            {paymentId ? (
              <SelectedPayment key={paymentId} paymentId={paymentId} />
            ) : (
              <Card className="px-6 py-24 text-center text-sm text-sub">
                왼쪽에서 결제를 고르세요.
              </Card>
            )}
          </div>
        )}
      </main>
    </>
  )
}

// The picked payment, fetched on its own (it may be on another page).
function SelectedPayment({ paymentId }) {
  const fetcher = useCallback(() => getPayment(paymentId), [paymentId])
  const { data: payment, error, reload } = useFetch(fetcher)
  if (error) {
    return error.code === 'NOT_FOUND' ? (
      <Card className="px-6 py-24 text-center text-sm text-sub">
        없는 결제예요.
      </Card>
    ) : (
      <LoadError onRetry={reload} className="py-24" />
    )
  }
  if (!payment) {
    return (
      <Card className="px-6 py-24 text-center text-sm text-sub">
        불러오는 중…
      </Card>
    )
  }
  return <PaymentDetail payment={payment} />
}

export default PaymentsPage
