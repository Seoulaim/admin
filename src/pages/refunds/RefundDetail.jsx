import { Link } from 'react-router'
import { useState } from 'react'
import { approveRefund, rejectRefund } from '../../api/refunds.js'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import PhotoStrip from '../../components/PhotoStrip.jsx'
import {
  daysBetween,
  formatDateTime,
  formatShortDate,
  seoulDateKey,
  todayKey,
} from '../../lib/dates.js'
import { languageName } from '../../lib/languages.js'
import { formatMoney } from '../../lib/money.js'
import {
  diaryOutcome,
  exceptionLabel,
  REFUND_DAYS,
  REFUND_STATUS,
} from '../../lib/refunds.js'

const dateTimeOr = (iso, fallback) => (iso ? formatDateTime(iso) : fallback)
import DiaryViewerDialog from '../diaryViewer/DiaryViewerDialog.jsx'
import { ApproveDialog, RejectDialog } from './RefundDialogs.jsx'

function Check({ ok, children }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span
        aria-label={ok ? '충족' : '미충족'}
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${ok ? 'bg-ok' : 'bg-danger'}`}
      >
        {ok ? '✓' : '✕'}
      </span>
      <span>{children}</span>
    </li>
  )
}

function Rows({ rows }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-sub">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

// One refund request: the request, payment, diary, the policy check, and
// 환불하기 / 예외로 환불하기 / 거절하기 — or what was decided.
function RefundDetail({ request, onChange, onToast }) {
  const [dialog, setDialog] = useState(null) // 'approve' | 'reject' | 'diary'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const { refund, payment, policy, refundWithinPolicy } = request
  const waiting = refund.status === 'requested'
  const daysLeft = daysBetween(todayKey(), request.deadline)

  async function approve(exception) {
    setBusy(true)
    setError(null)
    try {
      onChange(await approveRefund(request.id, exception))
      setDialog(null)
      onToast('환불했어요. 회원에게 메일이 가요.')
    } catch (e) {
      // REFUND_FAILED: details = 토스의 { code, message } (백엔드 fields).
      const toss = e.details?.message
        ? ` (토스: ${e.details.message}${e.details.code ? ` · ${e.details.code}` : ''})`
        : ''
      setError(
        e.code === 'REFUND_FAILED'
          ? `토스페이먼츠에서 취소하지 못했어요. 잠시 뒤 다시 시도해 주세요.${toss}`
          : e.code === 'ALREADY_DECIDED'
            ? '이미 처리된 요청이에요. 새로고침해 주세요.'
            : e.code === 'POLICY_EXCEPTION_REQUIRED'
              ? '정책 밖 요청이라 예외 사유가 필요해요.'
              : '환불하지 못했어요. 다시 시도해 주세요.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function reject(reason) {
    setBusy(true)
    try {
      onChange(await rejectRefund(request.id, reason))
      setDialog(null)
      onToast('거절 메일을 보냈어요.')
    } catch {
      onToast('처리하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={REFUND_STATUS[refund.status].tone}>
            {REFUND_STATUS[refund.status].label}
          </Chip>
          <Chip
            tone={
              refundWithinPolicy
                ? 'bg-ok-soft text-ok'
                : 'bg-danger/10 text-danger'
            }
          >
            {refundWithinPolicy ? '정책상 환불 가능' : '정책 밖'}
          </Chip>
          {waiting && (
            <span
              className={`ml-auto text-xs font-semibold tabular-nums ${daysLeft <= 0 ? 'text-danger' : 'text-muted'}`}
            >
              처리 기한 {formatShortDate(request.deadline)}
              {daysLeft < 0
                ? ' (지남)'
                : daysLeft === 0
                  ? ' (오늘)'
                  : ` (D-${daysLeft})`}
            </span>
          )}
        </div>
        <h2 className="text-lg font-bold">{request.title}</h2>
        <Rows
          rows={[
            [
              '회원',
              <Link
                key="member"
                to={`/members/${request.author.id}`}
                className="font-semibold text-point-strong underline underline-offset-2"
              >
                {request.author.nickname} ({request.author.id})
              </Link>,
            ],
            ['이메일', request.author.email],
            [
              '가입일',
              request.author.joinedAt
                ? formatShortDate(seoulDateKey(request.author.joinedAt))
                : '-',
            ],
            [
              '계정 이력',
              `다이어리 ${request.author.diaryCount}개 · 결제 ${request.author.paidPaymentCount}건 · 환불 승인 ${request.author.refundedCount}건 · 거절 ${request.author.rejectedRefundCount}건 · 미답변 문의 ${request.author.pendingInquiryCount}건`,
            ],
            ['작성 언어', languageName(request.language)],
            ['요청 시각', formatDateTime(request.createdAt)],
          ]}
        />
        <p className="rounded-xl bg-panel p-4 text-sm leading-relaxed whitespace-pre-line">
          {request.content}
        </p>
        <PhotoStrip urls={request.photoUrls} />
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="flex flex-col gap-3 p-5 sm:p-6">
          <h3 className="text-sm font-bold">결제</h3>
          <Rows
            rows={[
              [
                '금액',
                <b key="amount">
                  {formatMoney(payment.amount, payment.currency)}
                </b>,
              ],
              ['결제 시각', formatDateTime(payment.paidAt)],
              ['주문번호', payment.orderId],
              [
                '결제 수단',
                `${payment.provider === 'toss' ? '토스페이먼츠' : payment.provider}${payment.methodLabel ? ` · ${payment.methodLabel}` : ''}`,
              ],
              ['환불 제한 동의', formatDateTime(payment.refundConsentAt)],
              [
                '결제 후 편집',
                payment.editedAt ? formatDateTime(payment.editedAt) : '없음',
              ],
            ]}
          />
        </Card>
        <Card className="flex flex-col gap-3 p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            다이어리 제작 정보
            {payment.diary.deleted && (
              <Chip tone="bg-danger/10 text-danger">삭제됨</Chip>
            )}
          </h3>
          <Rows
            rows={[
              ['이름', payment.diary.name ?? '(삭제됨)'],
              [
                '종류',
                payment.diary.first
                  ? '첫 다이어리 (3쪽부터 결제)'
                  : '추가 다이어리',
              ],
              ['만든 날', dateTimeOr(payment.diary.createdAt, '-')],
              [
                '저장',
                `${payment.diary.saveCount}회${payment.diary.lastSavedAt ? ` · 마지막 ${formatDateTime(payment.diary.lastSavedAt)}` : ''}`,
              ],
              ['등록 사진', `${payment.diary.photoCount}장`],
              ['페이지', `${payment.diary.pages}쪽`],
              ['완성(Done)', dateTimeOr(payment.diary.completedAt, '아직')],
              [
                '다운로드',
                payment.diary.downloads.length === 0 ? (
                  '없음'
                ) : (
                  <ul key="downloads" className="flex flex-col gap-0.5">
                    {payment.diary.downloads.map((d, index) => (
                      <li key={index} className="tabular-nums">
                        {formatDateTime(d.at)} · {d.format} {d.pageCount}쪽
                      </li>
                    ))}
                  </ul>
                ),
              ],
            ]}
          />
          {payment.diary.pageUrls.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {payment.diary.pageUrls.map((url, index) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    title={`${index + 1}쪽 원본 (새 탭)`}
                  >
                    <img
                      src={url}
                      alt={`완성 ${index + 1}쪽`}
                      loading="lazy"
                      className="h-20 rounded-md border border-border bg-chip object-cover"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {waiting && (
            <p className="text-xs text-muted">
              환불하면: {diaryOutcome(payment.diary)}
            </p>
          )}
          {/* Outside the policy the admin checks the diary before deciding:
              the only time it's opened (logged; 개인정보처리방침 제11조 4호). */}
          {!refundWithinPolicy && payment.diary.pages > 0 && (
            <Button
              size="sm"
              className="self-start"
              onClick={() => setDialog('diary')}
            >
              다이어리 열람 (환불 검토)
            </Button>
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-3 p-5 sm:p-6">
        <h3 className="text-sm font-bold">
          환불 정책 확인{' '}
          <span className="text-xs font-normal text-sub">
            지금 기준 서버 판정 (제3조 1항, 제4조)
          </span>
        </h3>
        {policy ? (
          <ul className="flex flex-col gap-2">
            <Check ok={policy.within7Days.ok}>
              결제 후 {REFUND_DAYS}일 이내 — 결제{' '}
              {dateTimeOr(policy.within7Days.paidAt, '전')}, 기한{' '}
              {dateTimeOr(policy.within7Days.deadlineAt, '-')}
            </Check>
            <Check ok={policy.notEdited.ok}>
              {policy.notEdited.ok
                ? '결제 후 편집 이력 없음'
                : `결제 후 편집함 (${formatDateTime(policy.notEdited.editedAt)})`}
            </Check>
            <Check ok={policy.notFinalized.ok}>
              {policy.notFinalized.ok
                ? '다이어리를 완성(Done)하지 않음'
                : `완성함 (${dateTimeOr(policy.notFinalized.finalizedAt, '시각 없음')})`}
            </Check>
            <Check ok={policy.notDownloaded.ok}>
              {policy.notDownloaded.ok
                ? '완성본을 내려받지 않음'
                : `완성본 다운로드 ${policy.notDownloaded.downloadCount}회 (마지막 ${dateTimeOr(policy.notDownloaded.lastDownloadedAt, '-')})`}
            </Check>
          </ul>
        ) : (
          <p className="text-sm text-muted">
            결제를 찾을 수 없어 판정할 수 없어요.
          </p>
        )}
        {policy && policy.allOk !== refundWithinPolicy && (
          <p className="rounded-lg bg-warn-soft px-3 py-2 text-xs font-semibold text-warn">
            신청 후 상태가 바뀜 — 신청할 때는{' '}
            {refundWithinPolicy ? '정책 안' : '정책 밖'}, 지금은{' '}
            {policy.allOk ? '정책 안' : '정책 밖'}이에요. 승인 조건은 신청 시점
            판정을 따라요.
          </p>
        )}

        {waiting ? (
          <div className="mt-2 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
            {!refundWithinPolicy && (
              <p className="mr-auto text-xs text-muted">
                {policy?.allOk
                  ? "지금 기준으로는 모두 맞지만 신청 시점 판정은 정책 밖이에요. 승인 조건은 신청 시점 판정이라 환불하려면 예외 사유가 필요해요 (회사 판단이면 '기타 (운영 판단)')."
                  : '정책 밖이에요. 제5조에 해당하거나, 결제 후 편집한 요청을 회사 판단으로 환불한다면(제3조 2항, 기타) 예외 사유를 골라 환불할 수 있어요.'}
              </p>
            )}
            <Button variant="danger" onClick={() => setDialog('reject')}>
              거절하기
            </Button>
            <Button
              variant={refundWithinPolicy ? 'primary' : 'outline'}
              onClick={() => setDialog('approve')}
            >
              {refundWithinPolicy
                ? `${formatMoney(payment.amount, payment.currency)} 환불하기`
                : '예외로 환불하기'}
            </Button>
          </div>
        ) : (
          <div className="mt-2 rounded-xl bg-panel p-4 text-sm">
            <p className="font-bold">
              {refund.status === 'refunded' ? '환불했어요' : '거절했어요'}
              <span className="ml-2 text-xs font-normal text-sub tabular-nums">
                {formatDateTime(refund.decidedAt)} · {refund.adminName}
              </span>
            </p>
            {refund.exception && (
              <p className="mt-1.5 text-muted">
                예외 환불: {exceptionLabel(refund.exception.reason)}
                {refund.exception.memo && ` — ${refund.exception.memo}`}
              </p>
            )}
            {refund.rejectReason && (
              <p className="mt-1.5 whitespace-pre-line text-muted">
                보낸 사유: {refund.rejectReason}
              </p>
            )}
          </div>
        )}
      </Card>

      {dialog === 'approve' && (
        <ApproveDialog
          request={request}
          outsidePolicy={!refundWithinPolicy}
          busy={busy}
          error={error}
          onConfirm={approve}
          onClose={() => {
            setDialog(null)
            setError(null)
          }}
        />
      )}
      {dialog === 'diary' && (
        <DiaryViewerDialog
          diaryId={payment.diary.id}
          purpose="refund-review"
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'reject' && (
        <RejectDialog
          request={request}
          busy={busy}
          onConfirm={reject}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}

export default RefundDetail
