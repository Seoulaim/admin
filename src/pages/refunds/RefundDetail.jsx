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
  todayKey,
} from '../../lib/dates.js'
import { languageName } from '../../lib/languages.js'
import { formatKrw } from '../../lib/money.js'
import {
  diaryOutcome,
  exceptionLabel,
  REFUND_DAYS,
  REFUND_STATUS,
} from '../../lib/refunds.js'
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
  const { refund, payment, policy } = request
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
      setError(
        e.code === 'REFUND_FAILED'
          ? '토스페이먼츠에서 취소하지 못했어요. 잠시 뒤 다시 시도해 주세요.'
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
            tone={policy.ok ? 'bg-ok-soft text-ok' : 'bg-danger/10 text-danger'}
          >
            {policy.ok ? '정책상 환불 가능' : '정책 밖'}
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
              ['금액', <b key="amount">{formatKrw(payment.amount)}</b>],
              ['결제 시각', formatDateTime(payment.paidAt)],
              ['주문번호', payment.orderId],
              [
                '결제 수단',
                payment.provider === 'toss' ? '토스페이먼츠' : payment.provider,
              ],
              ['환불 제한 동의', formatDateTime(payment.refundConsentAt)],
            ]}
          />
        </Card>
        <Card className="flex flex-col gap-3 p-5 sm:p-6">
          <h3 className="text-sm font-bold">다이어리</h3>
          <Rows
            rows={[
              ['이름', payment.diary.name ?? '(삭제됨)'],
              [
                '종류',
                payment.diary.first
                  ? '첫 다이어리 (3쪽부터 결제)'
                  : '추가 다이어리',
              ],
              ['페이지', `${payment.diary.pages}쪽`],
              [
                '완성(Done)',
                payment.diary.finishedAt
                  ? formatDateTime(payment.diary.finishedAt)
                  : '아직',
              ],
            ]}
          />
          {waiting && (
            <p className="text-xs text-muted">
              환불하면: {diaryOutcome(payment.diary)}
            </p>
          )}
          {/* Outside the policy the admin checks the diary before deciding
              (logged; the privacy policy mentions it). */}
          {!policy.ok && payment.diary.pages > 0 && (
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
            요청한 시각 기준 (제3조)
          </span>
        </h3>
        <ul className="flex flex-col gap-2">
          <Check ok={policy.inTime}>
            결제 후 {REFUND_DAYS}일 이내 요청 — 결제 {policy.daysSincePayment}
            일째에 요청했어요
          </Check>
          <Check ok={policy.notFinished}>
            요청할 때 다이어리를 완성(Done)하지 않음
          </Check>
        </ul>

        {waiting ? (
          <div className="mt-2 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
            {!policy.ok && (
              <p className="mr-auto text-xs text-muted">
                정책 밖이에요. 중복 결제나 회사 오류처럼 제5조에 해당하면 예외로
                환불할 수 있어요.
              </p>
            )}
            <Button variant="danger" onClick={() => setDialog('reject')}>
              거절하기
            </Button>
            <Button
              variant={policy.ok ? 'primary' : 'outline'}
              onClick={() => setDialog('approve')}
            >
              {policy.ok
                ? `${formatKrw(payment.amount)} 환불하기`
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
          outsidePolicy={!policy.ok}
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
