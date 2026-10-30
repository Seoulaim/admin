import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { getPayments } from '../../api/payments.js'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import DateRangeFilter from '../../components/form/DateRangeFilter.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import LoadError from '../../components/LoadError.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import {
  formatDateTime,
  formatShortDate,
  isDateInRange,
  seoulDateKey,
} from '../../lib/dates.js'
import { formatKrw } from '../../lib/money.js'
import PaymentDetail from './PaymentDetail.jsx'
import { PAYMENT_STATUS } from './paymentStatus.js'

const STATUS_FILTERS = [
  { id: 'all', label: '전체' },
  ...Object.entries(PAYMENT_STATUS).map(([id, s]) => ({ id, label: s.label })),
]
const DIARY_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'finished', label: '완성' },
  { id: 'editing', label: '편집 중' },
]

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
    formatDateTime(p.paidAt),
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

// 결제 관리: diary payments with date / status / diary filters, totals for
// the range, CSV for Toss reconciliation; the one picked
// (/payments/:paymentId) on the right.
function PaymentsPage() {
  const { paymentId } = useParams()
  const { data: payments, error, reload } = useFetch(getPayments)
  const [range, setRange] = useState({ from: '', to: '' })
  const [status, setStatus] = useState('all')
  const [diaryState, setDiaryState] = useState('all')
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const shown = (payments ?? []).filter(
    (p) =>
      isDateInRange(seoulDateKey(p.paidAt), range) &&
      (status === 'all' || p.status === status) &&
      (diaryState === 'all' ||
        (diaryState === 'finished') === Boolean(p.diary.completedAt)) &&
      (!q ||
        [p.member.nickname, p.member.email, p.orderId, p.diary.name ?? ''].some(
          (text) => text.toLowerCase().includes(q),
        )),
  )
  const paid = shown.filter((p) => p.status !== 'refunded')
  const refunded = shown.filter((p) => p.status === 'refunded')
  const sum = (list) => list.reduce((total, p) => total + p.amount, 0)
  const selected = payments?.find((p) => p.id === paymentId)
  const chip = (active) =>
    `h-7 rounded-full px-3 text-xs font-semibold ${active ? 'bg-text text-white' : 'text-muted hover:bg-chip'}`

  return (
    <>
      <PageHeader title="결제 관리">
        <Button
          onClick={() => downloadCsv(shown)}
          disabled={shown.length === 0}
        >
          CSV 내보내기
        </Button>
      </PageHeader>
      <main className="flex flex-col gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8">
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <DateRangeFilter value={range} onChange={setRange} />
            <input
              type="search"
              aria-label="결제 검색"
              placeholder="닉네임·이메일·주문번호·다이어리"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={`${inputClass} h-9 max-w-xs lg:ml-auto`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1">
              <span className="mr-1 text-xs font-bold text-sub">상태</span>
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatus(f.id)}
                  className={chip(status === f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="mr-1 text-xs font-bold text-sub">다이어리</span>
              {DIARY_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setDiaryState(f.id)}
                  className={chip(diaryState === f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3 text-sm tabular-nums">
            <span>
              결제 <b>{paid.length}건</b> {formatKrw(sum(paid))}
            </span>
            <span className="text-muted">
              환불 {refunded.length}건 {formatKrw(sum(refunded))}
            </span>
            <span>
              순매출 <b className="text-point-strong">{formatKrw(sum(paid))}</b>
            </span>
          </div>
        </Card>

        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : !payments ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,400px)_minmax(0,1fr)] lg:gap-6">
            <Card className="flex max-h-[calc(100dvh-7rem)] flex-col overflow-hidden lg:sticky lg:top-20">
              {shown.length === 0 ? (
                <p className="py-16 text-center text-sm text-sub">
                  조건에 맞는 결제가 없어요.
                </p>
              ) : (
                <ul className="flex-1 divide-y divide-border overflow-y-auto">
                  {shown.map((p) => (
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
                            {formatDateTime(p.paidAt)} ·{' '}
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
            </Card>

            {selected ? (
              <PaymentDetail key={selected.id} payment={selected} />
            ) : (
              <Card className="px-6 py-24 text-center text-sm text-sub">
                {paymentId ? '없는 결제예요.' : '왼쪽에서 결제를 고르세요.'}
              </Card>
            )}
          </div>
        )}
      </main>
    </>
  )
}

export default PaymentsPage
