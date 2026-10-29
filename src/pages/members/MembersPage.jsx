import { useCallback, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { getGroups } from '../../api/artists.js'
import { getMembers, getWithdrawals } from '../../api/members.js'
import { buttonClass } from '../../components/buttonClass.js'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import DateRangeFilter from '../../components/form/DateRangeFilter.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import LoadError from '../../components/LoadError.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Toast from '../../components/Toast.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import {
  formatDateTime,
  formatShortDate,
  formatTimeAgo,
  isDateInRange,
  seoulDateKey,
} from '../../lib/dates.js'
import { languageName } from '../../lib/languages.js'
import { withdrawalReasonLabel } from '../../lib/members.js'

const MARKETING = [
  { id: 'all', label: '전체' },
  { id: 'yes', label: '동의' },
  { id: 'no', label: '미동의' },
]

function WithdrawalList() {
  const { data, error, reload } = useFetch(getWithdrawals)
  if (error) return <LoadError onRetry={reload} className="py-20" />
  if (!data)
    return <p className="py-20 text-center text-sm text-sub">불러오는 중…</p>
  if (data.length === 0) {
    return (
      <p className="py-20 text-center text-sm text-sub">
        강퇴한 회원이 없어요.
      </p>
    )
  }
  return (
    <ul className="divide-y divide-border">
      {data.map((w) => (
        <li
          key={w.memberId + w.at}
          className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3"
        >
          <span className="text-sm font-bold">{w.nickname}</span>
          <span className="text-xs text-sub">{w.memberId}</span>
          <span className="min-w-0 flex-1 basis-60 truncate text-sm text-muted">
            {withdrawalReasonLabel(w.reason)} — {w.memo}
          </span>
          <span className="text-xs text-sub tabular-nums">
            {formatDateTime(w.at)} · {w.adminName}
          </span>
        </li>
      ))}
    </ul>
  )
}

// 회원 관리: members (personal details partly hidden) with search, sign-up
// date and marketing filters; 강퇴 기록 lists withdrawn accounts.
function MembersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'withdrawn' ? 'withdrawn' : 'members'
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query, 250)
  const fetcher = useCallback(
    () =>
      Promise.all([getMembers(debounced), getGroups()]).then(
        ([members, groups]) => ({
          members,
          groups,
        }),
      ),
    [debounced],
  )
  const { data, error, reload } = useFetch(fetcher)
  const location = useLocation()
  const { toast } = useToast(location.state?.toast)
  const [range, setRange] = useState({ from: '', to: '' })
  const [marketing, setMarketing] = useState('all')
  const [paidOnly, setPaidOnly] = useState(false)

  const shown = (data?.members ?? []).filter(
    (m) =>
      isDateInRange(seoulDateKey(m.joinedAt), range) &&
      (marketing === 'all' || m.marketing === (marketing === 'yes')) &&
      (!paidOnly || m.paidCount > 0),
  )
  const groupName = (id) => data.groups.find((g) => g.id === id)?.name.en ?? id
  const chip = (active) =>
    `h-7 rounded-full px-3 text-xs font-semibold ${active ? 'bg-text text-white' : 'text-muted hover:bg-chip'}`

  return (
    <>
      <PageHeader title="회원 관리" />
      <nav className="flex gap-1 px-4 pt-4 sm:px-6 lg:px-8">
        {[
          ['members', '회원'],
          ['withdrawn', '강퇴 기록'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => setSearchParams(id === 'members' ? {} : { tab: id })}
            className={`h-9 rounded-full px-4 text-sm font-semibold ${tab === id ? 'bg-point-soft text-point-strong' : 'text-muted hover:bg-chip'}`}
          >
            {label}
          </button>
        ))}
      </nav>
      <main className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        {tab === 'withdrawn' ? (
          <Card className="overflow-hidden">
            <WithdrawalList />
          </Card>
        ) : (
          <>
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-sub">가입일</span>
                <DateRangeFilter value={range} onChange={setRange} />
                <input
                  type="search"
                  aria-label="회원 검색"
                  placeholder="닉네임·이름·이메일·회원 ID"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className={`${inputClass} h-9 max-w-72 xl:ml-auto`}
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-1">
                  <span className="mr-1 text-xs font-bold text-sub">
                    마케팅 수신
                  </span>
                  {MARKETING.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setMarketing(f.id)}
                      className={chip(marketing === f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                  <input
                    type="checkbox"
                    checked={paidOnly}
                    onChange={(event) => setPaidOnly(event.target.checked)}
                    className="size-4 accent-point-strong"
                  />
                  결제한 회원만
                </label>
                {data && (
                  <span className="ml-auto text-xs text-sub">
                    {shown.length}명 / 전체 {data.members.length}명
                  </span>
                )}
              </div>
            </Card>

            <Card className="overflow-x-auto">
              {error ? (
                <LoadError onRetry={reload} className="py-20" />
              ) : !data ? (
                <p className="py-20 text-center text-sm text-sub">
                  불러오는 중…
                </p>
              ) : shown.length === 0 ? (
                <p className="py-20 text-center text-sm text-sub">
                  조건에 맞는 회원이 없어요.
                </p>
              ) : (
                <table className="w-full min-w-[880px] text-sm">
                  <thead className="border-b border-border bg-panel text-left text-xs text-sub">
                    <tr>
                      {[
                        '회원',
                        '가입일',
                        '이메일',
                        '언어',
                        '최애 그룹',
                        '마케팅',
                        '결제',
                        '최근 접속',
                        '',
                      ].map((h) => (
                        <th key={h} className="px-4 py-2.5 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {shown.map((m) => (
                      <tr key={m.id} className="hover:bg-chip/40">
                        <td className="px-4 py-3">
                          <p className="font-bold">{m.nickname}</p>
                          <p className="text-xs text-sub">
                            {m.maskedName} · {m.id}
                          </p>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatShortDate(seoulDateKey(m.joinedAt))}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {m.maskedEmail}
                        </td>
                        <td className="px-4 py-3">
                          {languageName(m.language)}
                        </td>
                        <td className="max-w-48 truncate px-4 py-3 text-muted">
                          {m.biasGroupIds.map(groupName).join(', ') || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <Chip
                            tone={
                              m.marketing
                                ? 'bg-ok-soft text-ok'
                                : 'bg-chip text-sub'
                            }
                          >
                            {m.marketing ? '동의' : '미동의'}
                          </Chip>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {m.paidCount}건
                        </td>
                        <td className="px-4 py-3 text-xs text-sub">
                          {formatTimeAgo(m.lastSeenAt)}
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
            </Card>
            <p className="text-xs text-sub">
              목록에서는 이름·이메일을 일부 가려서 보여줘요. 상세를 열면 전체가
              보이고 열람 기록이 남아요.
            </p>
          </>
        )}
      </main>
      <Toast toast={toast} />
    </>
  )
}

export default MembersPage
