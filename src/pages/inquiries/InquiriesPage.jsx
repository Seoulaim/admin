import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { getInquiries } from '../../api/inquiries.js'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import LoadError from '../../components/LoadError.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Toast from '../../components/Toast.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import DateRangeFilter from '../../components/form/DateRangeFilter.jsx'
import { formatDateTime, isDateInRange, seoulDateKey } from '../../lib/dates.js'
import { languageName } from '../../lib/languages.js'
import {
  INQUIRY_CATEGORIES,
  inquiryCategoryLabel,
} from '../../lib/inquiries.js'
import InquiryDetail from './InquiryDetail.jsx'

const STATUS_TABS = [
  { id: 'all', label: '전체' },
  { id: 'received', label: '답변 대기' },
  { id: 'answered', label: '답변 완료' },
]
// Refund inquiries live in 환불 관리.
const CATEGORIES = INQUIRY_CATEGORIES.filter((c) => c.id !== 'refund')

// 문의 관리: Help Center inquiries (refunds aside) on the left, the one
// picked (/inquiries/:inquiryId) on the right.
function InquiriesPage() {
  const { inquiryId } = useParams()
  const { data, error, reload, update } = useFetch(getInquiries)
  const { toast, showToast } = useToast()
  const [status, setStatus] = useState('received')
  const [category, setCategory] = useState(null)
  const [query, setQuery] = useState('')
  const [range, setRange] = useState({ from: '', to: '' })

  const q = query.trim().toLowerCase()
  // Everything but the category, so each category button can show its count.
  const matching = (data?.inquiries ?? []).filter(
    (i) =>
      (status === 'all' || i.status === status) &&
      isDateInRange(seoulDateKey(i.createdAt), range) &&
      (!q ||
        [i.title, i.content, i.author.nickname, i.author.email].some((text) =>
          text.toLowerCase().includes(q),
        )),
  )
  const shown = matching.filter((i) => !category || i.category === category)
  const countOf = (id) => matching.filter((i) => i.category === id).length
  const waiting = data?.inquiries.filter((i) => i.status === 'received').length
  const selected = data?.inquiries.find((i) => i.id === inquiryId)
  const categoryButton = (active) =>
    `h-9 rounded-full border px-3.5 text-sm font-semibold ${active ? 'border-point bg-point-soft text-point-strong' : 'border-border text-muted hover:bg-chip'}`

  return (
    <>
      <PageHeader title="문의 관리" />
      <main className="p-4 sm:p-6 lg:p-8">
        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : !data ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : (
          <div className="flex flex-col gap-4 lg:gap-6">
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div role="tablist" className="flex gap-1">
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={status === tab.id}
                      onClick={() => setStatus(tab.id)}
                      className={`h-9 rounded-full px-4 text-sm font-semibold ${status === tab.id ? 'bg-point-soft text-point-strong' : 'text-muted hover:bg-chip'}`}
                    >
                      {tab.label}
                      {tab.id === 'received' && ` ${waiting}`}
                    </button>
                  ))}
                </div>
                <DateRangeFilter value={range} onChange={setRange} />
                <input
                  type="search"
                  aria-label="문의 검색"
                  placeholder="제목·내용·닉네임·이메일"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className={`${inputClass} h-9 max-w-60 xl:ml-auto`}
                />
              </div>
              <div
                role="group"
                aria-label="문의 유형"
                className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3"
              >
                <button
                  type="button"
                  aria-pressed={!category}
                  onClick={() => setCategory(null)}
                  className={categoryButton(!category)}
                >
                  일반 문의 전체{' '}
                  <b className="tabular-nums">{matching.length}</b>
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={category === c.id}
                    onClick={() => setCategory(category === c.id ? null : c.id)}
                    className={categoryButton(category === c.id)}
                  >
                    {c.label} <b className="tabular-nums">{countOf(c.id)}</b>
                  </button>
                ))}
                {data.refundCount > 0 && (
                  <Link
                    to="/refunds"
                    className="ml-auto rounded-full bg-warn-soft px-3 py-1.5 text-xs font-semibold text-warn"
                  >
                    환불 요청 {data.refundCount}건은 환불 관리에서 →
                  </Link>
                )}
              </div>
            </Card>

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,400px)_minmax(0,1fr)] lg:gap-6">
              <Card className="flex max-h-[calc(100dvh-7rem)] flex-col overflow-hidden lg:sticky lg:top-20">
                {shown.length === 0 ? (
                  <p className="py-16 text-center text-sm text-sub">
                    {status === 'received' && !q && !category && !range.from
                      ? '답변할 문의가 없어요.'
                      : '조건에 맞는 문의가 없어요.'}
                  </p>
                ) : (
                  <ul className="flex-1 divide-y divide-border overflow-y-auto">
                    {shown.map((inquiry) => (
                      <li key={inquiry.id}>
                        <Link
                          to={`/inquiries/${inquiry.id}`}
                          aria-current={
                            inquiry.id === inquiryId ? 'true' : undefined
                          }
                          className={`flex flex-col gap-1 px-4 py-3 ${inquiry.id === inquiryId ? 'bg-point-soft/60' : 'hover:bg-chip/60'}`}
                        >
                          <span className="flex items-center gap-2">
                            <Chip className="text-[11px]">
                              {inquiryCategoryLabel(inquiry.category)}
                            </Chip>
                            <span className="min-w-0 flex-1 truncate text-sm font-bold">
                              {inquiry.title}
                            </span>
                            <Chip
                              tone={
                                inquiry.status === 'received'
                                  ? 'bg-warn-soft text-warn'
                                  : 'bg-ok-soft text-ok'
                              }
                              className="text-[11px]"
                            >
                              {inquiry.status === 'received'
                                ? '답변 대기'
                                : '답변 완료'}
                            </Chip>
                          </span>
                          <span className="truncate text-xs text-sub tabular-nums">
                            {inquiry.author.nickname} ·{' '}
                            {languageName(inquiry.language)} ·{' '}
                            {formatDateTime(inquiry.createdAt)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {selected ? (
                <InquiryDetail
                  key={selected.id}
                  inquiry={selected}
                  onToast={showToast}
                  onChange={(next) =>
                    update((d) => ({
                      ...d,
                      inquiries: d.inquiries.map((i) =>
                        i.id === next.id ? next : i,
                      ),
                    }))
                  }
                />
              ) : (
                <Card className="px-6 py-24 text-center text-sm text-sub">
                  {inquiryId
                    ? '없는 문의예요. 환불 문의라면 환불 관리에서 확인해 주세요.'
                    : '왼쪽에서 문의를 고르세요.'}
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
      <Toast toast={toast} />
    </>
  )
}

export default InquiriesPage
