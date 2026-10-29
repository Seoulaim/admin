import { useState } from 'react'
import { Link } from 'react-router'
import { reopenDiary } from '../../api/memberDiaries.js'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import Dialog from '../../components/Dialog.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import { formatDateTime } from '../../lib/dates.js'
import { formatKrw } from '../../lib/money.js'
import DiaryViewerDialog from '../diaryViewer/DiaryViewerDialog.jsx'
import { PAYMENT_STATUS } from './paymentStatus.js'

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

// Reopening a finished diary: why (kept, and emailed to the member).
function ReopenDialog({ payment, busy, onConfirm, onClose }) {
  const [reason, setReason] = useState('')

  return (
    <Dialog
      open
      title="편집을 다시 열까요?"
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(reason.trim())}
            disabled={busy || !reason.trim()}
          >
            {busy ? '여는 중…' : '편집 다시 열기'}
          </Button>
        </>
      }
    >
      <ul className="mb-4 flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted">
        <li>
          &lsquo;{payment.diary.name}&rsquo;이(가) 완성 전 상태로 돌아가서,
          회원이 다시 꾸미고 Done을 누를 수 있어요.
        </li>
        <li>{payment.member.email}로 편집이 다시 열렸다는 메일이 가요.</li>
        <li>
          결제는 그대로이고, 환불 기간(결제 후 7일)은 다시 시작되지 않아요.
        </li>
      </ul>
      <textarea
        aria-label="다시 여는 이유"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={3}
        maxLength={500}
        placeholder="다시 여는 이유 (기록돼요). 예: 3쪽 중 2쪽이 비어 있음, 실수로 Done 누름 문의(iq-…)"
        className={`${inputClass} resize-y py-2`}
      />
    </Dialog>
  )
}

// One payment: what was paid, by whom, for which diary — and, for a paid
// diary finished by mistake, reading it and reopening it for editing.
function PaymentDetail({ payment, onChange, onToast }) {
  const [dialog, setDialog] = useState(null) // 'diary' | 'reopen'
  const [reviewed, setReviewed] = useState(false)
  const [busy, setBusy] = useState(false)
  const status = PAYMENT_STATUS[payment.status]
  const { diary } = payment
  const canReopen = diary.finishedAt && payment.status !== 'refunded'

  async function reopen(reason) {
    setBusy(true)
    try {
      const next = await reopenDiary(payment.id, reason)
      onChange({ ...payment, diary: next })
      setDialog(null)
      onToast('편집을 다시 열었어요. 회원에게 메일이 가요.')
    } catch {
      onToast('다시 열지 못했어요. 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={status.tone}>{status.label}</Chip>
          {payment.sameDiaryPayments > 0 && (
            <Chip tone="bg-danger/10 text-danger">
              같은 다이어리 결제 {payment.sameDiaryPayments + 1}건 · 중복 의심
            </Chip>
          )}
          <span className="ml-auto text-xs text-sub tabular-nums">
            {formatDateTime(payment.paidAt)}
          </span>
        </div>
        <p className="text-2xl font-bold tabular-nums">
          {formatKrw(payment.amount)}
        </p>
        <Rows
          rows={[
            ['주문번호', payment.orderId],
            [
              '결제 수단',
              payment.provider === 'toss' ? '토스페이먼츠' : payment.provider,
            ],
            ['환불 제한 동의', formatDateTime(payment.refundConsentAt)],
            [
              '회원',
              <Link
                key="member"
                to={`/members/${payment.member.id}`}
                className="font-semibold text-point-strong underline underline-offset-2"
              >
                {payment.member.nickname} ({payment.member.id})
              </Link>,
            ],
            ['이메일', payment.member.email],
          ]}
        />
        {payment.refundRequestId && (
          <Link
            to={`/refunds/${payment.refundRequestId}`}
            className="self-start text-sm font-semibold text-point-strong underline underline-offset-2"
          >
            환불 요청 보기 →
          </Link>
        )}
      </Card>

      <Card className="flex flex-col gap-3 p-5 sm:p-6">
        <h3 className="text-sm font-bold">다이어리</h3>
        <Rows
          rows={[
            ['이름', diary.name ?? '(삭제됨)'],
            [
              '종류',
              diary.first ? '첫 다이어리 (3쪽부터 결제)' : '추가 다이어리',
            ],
            ['페이지', `${diary.pages}쪽`],
            [
              '완성(Done)',
              diary.finishedAt ? formatDateTime(diary.finishedAt) : '편집 중',
            ],
          ]}
        />
        {diary.reopened.length > 0 && (
          <ul className="flex flex-col gap-1 rounded-lg bg-panel p-3 text-xs text-muted">
            {diary.reopened.map((r) => (
              <li key={r.at}>
                <b className="text-text">편집 다시 열림</b>{' '}
                {formatDateTime(r.at)} · {r.adminName} — {r.reason}
              </li>
            ))}
          </ul>
        )}

        {canReopen && (
          <div className="mt-1 flex flex-col gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted">
              덜 꾸몄는데 Done을 눌렀다는 요청이면, 다이어리를 열람해 확인한 뒤
              편집을 다시 열 수 있어요. 열람 기록이 남아요.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setReviewed(true)
                  setDialog('diary')
                }}
              >
                다이어리 열람 (검수)
              </Button>
              <Button
                variant="primary"
                onClick={() => setDialog('reopen')}
                disabled={!reviewed}
                title={
                  reviewed ? undefined : '먼저 다이어리를 열람해 확인해 주세요.'
                }
              >
                편집 다시 열기
              </Button>
            </div>
          </div>
        )}
        {diary.finishedAt && payment.status === 'refunded' && (
          <p className="text-xs text-sub">환불된 결제라 다시 열 수 없어요.</p>
        )}
      </Card>

      {dialog === 'diary' && (
        <DiaryViewerDialog
          diaryId={diary.id}
          purpose="reopen-review"
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'reopen' && (
        <ReopenDialog
          payment={payment}
          busy={busy}
          onConfirm={reopen}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}

export default PaymentDetail
