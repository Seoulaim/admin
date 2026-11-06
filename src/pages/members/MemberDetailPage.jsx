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
import { inquiryCategoryLabel } from '../../lib/inquiries.js'
import { languageName } from '../../lib/languages.js'
import { MEMBER_STATUS } from '../../lib/members.js'
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

// 회원 관리 › 상세 (/members/:memberId).
function MemberDetailPage() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const fetcher = useCallback(() => getMember(memberId), [memberId])
  const { data: member, error, reload } = useFetch(fetcher)
  const [withdrawing, setWithdrawing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [withdrawError, setWithdrawError] = useState(null)

  async function withdraw(reason, memo) {
    setBusy(true)
    setWithdrawError(null)
    try {
      await withdrawMember(member.id, reason, memo)
      navigate('/members?status=withdrawn', {
        state: { toast: `${member.nickname} 회원을 강퇴했어요.` },
      })
    } catch (e) {
      setBusy(false)
      if (e.code === 'ALREADY_WITHDRAWN') {
        setWithdrawing(false)
        reload()
      } else {
        setWithdrawError(
          e.code === 'BAD_REQUEST' || e.code === 'COMMON_INVALID_REQUEST'
            ? '사유는 1~200자로 적어 주세요.'
            : '강퇴하지 못했어요. 다시 시도해 주세요.',
        )
      }
    }
  }

  // null: 서버에 기록이 없는 동의 (약관·개인정보·연령).
  const consent = (c) =>
    c == null ? (
      <span className="text-sub">기록 없음</span>
    ) : c.agreed ? (
      `동의 · ${c.at ? formatDateTime(c.at) : '가입 시'}`
    ) : (
      <span className="text-sub">동의 안 함</span>
    )
  const withdrawn = member?.status === 'withdrawn'

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
              <Avatar
                src={member.profileImageUrl}
                name={member.nickname}
                className="size-16 text-2xl"
              />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-xl font-bold">
                  {member.nickname}
                  {member.name && (
                    <span className="text-base font-medium text-muted">
                      {member.name}
                    </span>
                  )}
                  <Chip tone={MEMBER_STATUS[member.status]?.tone}>
                    {MEMBER_STATUS[member.status]?.label ?? member.status}
                  </Chip>
                </p>
                <p className="mt-1 text-sm text-sub">
                  {member.email ?? '(이메일 삭제됨 · 탈퇴 회원)'} · {member.id}{' '}
                  · {formatShortDate(seoulDateKey(member.joinedAt))} 가입
                  {member.lastSeenAt &&
                    ` · 최근 접속 ${formatDateTime(member.lastSeenAt)}`}
                </p>
                {withdrawn && (
                  <p className="mt-1 text-sm text-muted">
                    {member.withdrawnAt && formatDateTime(member.withdrawnAt)}{' '}
                    {member.withdrawnBy === 'admin' ? '강퇴' : '본인 탈퇴'}
                    {member.withdrawReason && ` — ${member.withdrawReason}`}
                  </p>
                )}
              </div>
              {!withdrawn && (
                <Button variant="danger" onClick={() => setWithdrawing(true)}>
                  강퇴
                </Button>
              )}
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
                          {d.first ? '첫 다이어리' : '추가'} ·{' '}
                          {d.paid ? '결제' : '무료'} · 저장 {d.saveCount}회 ·
                          다운로드 {d.downloadCount}회
                        </span>
                        {d.deleted && (
                          <Chip tone="bg-danger/10 text-danger">삭제됨</Chip>
                        )}
                        <Chip
                          tone={
                            d.completedAt
                              ? 'bg-ok-soft text-ok'
                              : 'bg-chip text-muted'
                          }
                        >
                          {d.completedAt ? '완성' : '편집 중'}
                        </Chip>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-sub">
                  다이어리 내용과 등록 사진은 환불 정책 밖 환불 요청을 검토할
                  때만 환불 관리에서 볼 수 있어요.
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
                          {p.status === 'refunded' && (
                            <Chip tone={REFUND_STATUS.refunded.tone}>
                              환불됨
                            </Chip>
                          )}
                          <span className="text-xs text-sub tabular-nums">
                            {p.paidAt ? formatDateTime(p.paidAt) : '-'}
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
                      member.notifications.service == null
                        ? '-'
                        : member.notifications.service
                          ? '받음'
                          : '안 받음',
                    ],
                    [
                      '푸시 알림',
                      member.notifications.push ? '받음' : '안 받음',
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
                <p className="text-xs text-sub">
                  환불 승인 {member.stats.refundedCount}건 · 거절{' '}
                  {member.stats.rejectedRefundCount}건 · 미답변 문의{' '}
                  {member.stats.pendingInquiryCount}건
                </p>
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
                          {i.refund ? (
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
                {member.views.length === 0 && (
                  <Empty>열람 기록은 아직 서버에 남지 않아요.</Empty>
                )}
                <ul className="flex flex-col gap-1 text-xs text-muted">
                  {member.views.map((v) => (
                    <li key={v.at} className="tabular-nums">
                      {formatDateTime(v.at)} · {v.adminName} · {v.purpose}
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
          error={withdrawError}
          onConfirm={withdraw}
          onClose={() => {
            setWithdrawing(false)
            setWithdrawError(null)
          }}
        />
      )}
    </>
  )
}

export default MemberDetailPage
