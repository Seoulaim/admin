import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getMember, withdrawMember } from '../../api/members.js'
import Avatar from '../../components/Avatar.jsx'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import LoadError from '../../components/LoadError.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import {
  addDays,
  formatDateTime,
  formatShortDate,
  seoulDateKey,
} from '../../lib/dates.js'
import { pickText } from '../../lib/events.js'
import { inquiryCategoryLabel } from '../../lib/inquiries.js'
import { languageName } from '../../lib/languages.js'
import { formatKrw } from '../../lib/money.js'
import { REFUND_STATUS } from '../../lib/refunds.js'
import WithdrawDialog from './WithdrawDialog.jsx'

// Marketing consent must be re-confirmed every 2 years (정보통신망법).
const RECHECK_DAYS = 365 * 2

function Section({ title, children, className = '' }) {
  return (
    <Card className={`flex flex-col gap-3 p-5 sm:p-6 ${className}`}>
      <h2 className="text-base font-bold">{title}</h2>
      {children}
    </Card>
  )
}

function Rows({ rows }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-sub">{label}</dt>
          <dd className="min-w-0 text-right break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

const Empty = ({ children }) => <p className="text-sm text-sub">{children}</p>

// 회원 관리 › 상세 (/members/:memberId): opening it is logged.
function MemberDetailPage() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const fetcher = useCallback(() => getMember(memberId), [memberId])
  const { data: member, error, reload } = useFetch(fetcher)
  const [withdrawing, setWithdrawing] = useState(false)
  const [busy, setBusy] = useState(false)

  async function withdraw(reason, memo) {
    setBusy(true)
    try {
      await withdrawMember(member.id, reason, memo)
      navigate('/members?tab=withdrawn', {
        state: { toast: `${member.nickname} 회원을 강퇴했어요.` },
      })
    } catch {
      setBusy(false)
    }
  }

  const consent = (c) =>
    c.agreed ? (
      `동의 · ${formatDateTime(c.at)}`
    ) : (
      <span className="text-sub">동의 안 함</span>
    )

  return (
    <>
      <PageHeader title="회원 관리">
        <Link
          to="/members"
          className="text-sm font-semibold text-muted hover:text-text"
        >
          ← 목록
        </Link>
      </PageHeader>
      <main className="flex flex-col gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8">
        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : !member ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : (
          <>
            <Card className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
              <Avatar name={member.nickname} className="size-16 text-2xl" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-xl font-bold">
                  {member.nickname}
                  <span className="text-base font-medium text-muted">
                    {member.name}
                  </span>
                </p>
                <p className="mt-1 text-sm text-sub">
                  {member.email} · {member.id} ·{' '}
                  {formatShortDate(seoulDateKey(member.joinedAt))} 가입 · 최근
                  접속 {formatDateTime(member.lastSeenAt)}
                </p>
              </div>
              <Button variant="danger" onClick={() => setWithdrawing(true)}>
                강퇴
              </Button>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
              <Section title="기본 정보">
                <Rows
                  rows={[
                    ['앱 언어', languageName(member.language)],
                    [
                      '최애',
                      member.biases.length
                        ? member.biases
                            .map((b) => `${b.group.en} ${b.name.en}`)
                            .join(', ')
                        : '없음',
                    ],
                    [
                      '여행 플랜',
                      member.plan
                        ? `${formatShortDate(member.plan.arrivalDate)} ~ ${formatShortDate(member.plan.departureDate)} · 장소 ${member.plan.places}곳`
                        : '없음',
                    ],
                  ]}
                />
                <h3 className="mt-2 text-sm font-bold">
                  다이어리 {member.diaries.length}개
                </h3>
                {member.diaries.length === 0 ? (
                  <Empty>만든 다이어리가 없어요.</Empty>
                ) : (
                  <ul className="flex flex-col gap-1 text-sm">
                    {member.diaries.map((d) => (
                      <li key={d.id} className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate">
                          {d.name ?? '(삭제됨)'}
                        </span>
                        <span className="text-xs text-sub">
                          {d.pages}쪽 · {d.first ? '첫 다이어리' : '추가'} ·{' '}
                          {d.paid ? '결제' : '무료'}
                        </span>
                        <Chip
                          tone={
                            d.finishedAt
                              ? 'bg-ok-soft text-ok'
                              : 'bg-chip text-muted'
                          }
                        >
                          {d.finishedAt ? '완성' : '편집 중'}
                        </Chip>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-sub">
                  다이어리 내용은 환불·편집 다시 열기 검토 때만 결제 관리·환불
                  관리에서 볼 수 있어요.
                </p>
              </Section>

              <Section title="결제 내역">
                {member.payments.length === 0 ? (
                  <Empty>결제한 내역이 없어요.</Empty>
                ) : (
                  <ul className="divide-y divide-border">
                    {member.payments.map((p) => (
                      <li key={p.id}>
                        <Link
                          to={`/payments/${p.id}`}
                          className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-chip"
                        >
                          <span className="font-bold tabular-nums">
                            {formatKrw(p.amount)}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-muted">
                            {p.diary.name ?? '(삭제됨)'}
                          </span>
                          <span className="text-xs text-sub tabular-nums">
                            {formatDateTime(p.paidAt)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="가입 동의 이력">
                <Rows
                  rows={[
                    ['이용약관 (필수)', consent(member.consents.terms)],
                    [
                      '개인정보 수집·이용 (필수)',
                      consent(member.consents.privacy),
                    ],
                    ['만 14세 이상 (필수)', consent(member.consents.age)],
                    [
                      '광고성 정보 수신 (선택)',
                      consent(member.consents.marketing),
                    ],
                  ]}
                />
              </Section>

              <Section title="이메일 수신 설정 (MA09)">
                <Rows
                  rows={[
                    [
                      '계정·서비스 메일',
                      member.notifications.service ? '받음' : '안 받음',
                    ],
                    [
                      '마케팅 메일',
                      member.notifications.marketing ? '받음' : '안 받음',
                    ],
                    [
                      '마케팅 설정 변경일',
                      formatDateTime(member.notifications.marketingUpdatedAt),
                    ],
                    [
                      '다음 수신 동의 확인 메일',
                      member.notifications.marketing
                        ? formatShortDate(
                            addDays(
                              seoulDateKey(
                                member.notifications.marketingUpdatedAt,
                              ),
                              RECHECK_DAYS,
                            ),
                          )
                        : '-',
                    ],
                  ]}
                />
                <p className="text-xs text-sub">
                  계정 메일을 꺼도 결제·환불·문의 답변 같은 필수 메일은 가요.
                </p>
              </Section>

              <Section title="문의·환불">
                {member.inquiries.length === 0 ? (
                  <Empty>남긴 문의가 없어요.</Empty>
                ) : (
                  <ul className="divide-y divide-border">
                    {member.inquiries.map((i) => (
                      <li key={i.id}>
                        <Link
                          to={
                            i.category === 'refund'
                              ? `/refunds/${i.id}`
                              : `/inquiries/${i.id}`
                          }
                          className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-chip"
                        >
                          <Chip className="text-[11px]">
                            {inquiryCategoryLabel(i.category)}
                          </Chip>
                          <span className="min-w-0 flex-1 truncate">
                            {i.title}
                          </span>
                          {i.category === 'refund' ? (
                            <Chip tone={REFUND_STATUS[i.refund.status].tone}>
                              {REFUND_STATUS[i.refund.status].label}
                            </Chip>
                          ) : (
                            <Chip
                              tone={
                                i.status === 'received'
                                  ? 'bg-warn-soft text-warn'
                                  : 'bg-ok-soft text-ok'
                              }
                            >
                              {i.status === 'received'
                                ? '답변 대기'
                                : '답변 완료'}
                            </Chip>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="만족도 조사">
                {!member.survey ? (
                  <Empty>
                    {member.plan
                      ? '아직 응답하지 않았어요.'
                      : '플랜이 없어 대상이 아니에요.'}
                  </Empty>
                ) : (
                  <>
                    <p className="text-xs text-sub">
                      {formatDateTime(member.survey.response.submittedAt)} 응답
                      · 기프티콘{' '}
                      {member.survey.response.gift.status === 'sent'
                        ? `발송 완료 (${formatDateTime(member.survey.response.gift.sentAt)})`
                        : '미발송'}
                    </p>
                    <dl className="flex flex-col gap-2 text-sm">
                      {member.survey.questions.map((q) => {
                        const answer = member.survey.response.answers[q.id]
                        if (answer == null || answer === '') return null
                        const label = (id) =>
                          pickText(q.options.find((o) => o.id === id)?.label) ||
                          id
                        return (
                          <div key={q.id}>
                            <dt className="text-sub">{pickText(q.title)}</dt>
                            <dd className="mt-0.5">
                              {q.type === 'rating'
                                ? `${'★'.repeat(answer)} (${answer})`
                                : q.type === 'text'
                                  ? answer
                                  : [answer].flat().map(label).join(', ') ||
                                    '-'}
                            </dd>
                          </div>
                        )
                      })}
                    </dl>
                  </>
                )}
              </Section>

              <Section title="계정 기록">
                <ul className="flex flex-col gap-1.5 text-sm">
                  {[...member.history].reverse().map((h) => (
                    <li key={h.at + h.event} className="flex gap-3">
                      <span className="shrink-0 text-xs text-sub tabular-nums">
                        {formatDateTime(h.at)}
                      </span>
                      <span>
                        <b>{h.event}</b>{' '}
                        <span className="text-muted">{h.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <h3 className="mt-2 text-sm font-bold">개인정보 열람 기록</h3>
                <ul className="flex flex-col gap-1 text-xs text-muted">
                  {member.views.map((v) => (
                    <li key={v.at} className="tabular-nums">
                      {formatDateTime(v.at)} · {v.adminName} · 회원 상세 열람
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
          </>
        )}
      </main>
      {withdrawing && member && (
        <WithdrawDialog
          member={member}
          busy={busy}
          onConfirm={withdraw}
          onClose={() => setWithdrawing(false)}
        />
      )}
    </>
  )
}

export default MemberDetailPage
