import { useCallback, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { getMembers, PAGE_SIZE } from '../../api/members.js'
import Button from '../../components/Button.jsx'
import { buttonClass } from '../../components/buttonClass.js'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import LoadError from '../../components/LoadError.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Toast from '../../components/Toast.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import { formatShortDate, seoulDateKey } from '../../lib/dates.js'
import { languageName } from '../../lib/languages.js'
import { MEMBER_STATUS } from '../../lib/members.js'

const STATUS_FILTERS = [
  { id: 'all', label: '전체' },
  ...Object.entries(MEMBER_STATUS).map(([id, s]) => ({ id, label: s.label })),
]

// 회원 관리: members (email partly hidden) with search and status filter,
// searched on the server a page at a time. ?status=withdrawn (or the old
// ?tab=withdrawn) opens on withdrawn accounts.
function MembersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status =
    searchParams.get('tab') === 'withdrawn'
      ? 'withdrawn'
      : (MEMBER_STATUS[searchParams.get('status')] &&
          searchParams.get('status')) ||
        'all'
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const debounced = useDebouncedValue(query, 250)
  const fetcher = useCallback(
    () => getMembers({ q: debounced, status, page }),
    [debounced, status, page],
  )
  const { data, error, reload } = useFetch(fetcher)
  const location = useLocation()
  const { toast } = useToast(location.state?.toast)
  const members = data?.items
  const pageCount = data
    ? Math.max(1, Math.ceil(data.totalElements / PAGE_SIZE))
    : 1
  const chip = (active) =>
    `h-7 rounded-full px-3 text-xs font-semibold ${active ? 'bg-text text-white' : 'text-muted hover:bg-chip'}`

  return (
    <>
      <PageHeader title="회원 관리" />
      <main className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <Card className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
          <div className="flex items-center gap-1">
            <span className="mr-1 text-xs font-bold text-sub">상태</span>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setSearchParams(f.id === 'all' ? {} : { status: f.id })
                  setPage(0)
                }}
                className={chip(status === f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            aria-label="회원 검색"
            placeholder="닉네임·이메일"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(0)
            }}
            className={`${inputClass} h-9 max-w-72 xl:ml-auto`}
          />
        </Card>

        <Card className="overflow-x-auto">
          {error ? (
            <LoadError onRetry={reload} className="py-20" />
          ) : !members ? (
            <p className="py-20 text-center text-sm text-sub">불러오는 중…</p>
          ) : members.length === 0 ? (
            <p className="py-20 text-center text-sm text-sub">
              조건에 맞는 회원이 없어요.
            </p>
          ) : (
            <table className="w-full min-w-[760px] text-sm [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
              <thead className="border-b border-border bg-panel text-left text-xs text-sub">
                <tr>
                  {[
                    '회원',
                    '가입일',
                    '이메일',
                    '언어',
                    '다이어리',
                    '결제',
                    '상태',
                    '',
                  ].map((h) => (
                    <th key={h} className="px-4 py-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-chip/40">
                    <td className="px-4 py-3">
                      <p className="font-bold">{m.nickname}</p>
                      <p className="text-xs text-sub">{m.id}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatShortDate(seoulDateKey(m.joinedAt))}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {m.maskedEmail ?? '-'}
                    </td>
                    <td className="px-4 py-3">{languageName(m.language)}</td>
                    <td className="px-4 py-3 tabular-nums">{m.diaryCount}개</td>
                    <td className="px-4 py-3 tabular-nums">{m.paidCount}건</td>
                    <td className="px-4 py-3">
                      <Chip tone={MEMBER_STATUS[m.status]?.tone}>
                        {MEMBER_STATUS[m.status]?.label ?? m.status}
                      </Chip>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/members/${m.id}`}
                        className={buttonClass('outline', 'sm')}
                      >
                        상세
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {members && (
            <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2 text-xs text-sub tabular-nums">
              <span>
                전체 {data.totalElements}명 · {page + 1}/{pageCount}쪽
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
          )}
        </Card>
        <p className="text-xs text-sub">
          목록에서는 이메일을 일부 가려서 보여줘요. 상세를 열면 전체가 보여요.
        </p>
      </main>
      <Toast toast={toast} />
    </>
  )
}

export default MembersPage
