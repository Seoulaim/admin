import { useState } from 'react'
import Button from '../../components/Button.jsx'
import Dialog from '../../components/Dialog.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import { formatKrw } from '../../lib/money.js'
import { diaryOutcome, EXCEPTION_REASONS } from '../../lib/refunds.js'

// Confirms a refund. outsidePolicy: the admin must pick a 제5조 reason (or
// 기타 with a memo) — onConfirm(exception | null).
export function ApproveDialog({
  request,
  outsidePolicy,
  busy,
  error,
  onConfirm,
  onClose,
}) {
  const [reason, setReason] = useState(null)
  const [memo, setMemo] = useState('')
  const [invalid, setInvalid] = useState(false)

  // Shown after a failed 환불하기, until it's fixed.
  const problem = !invalid
    ? null
    : !reason
      ? '예외 사유를 골라 주세요.'
      : reason === 'other' && !memo.trim()
        ? '기타는 사유를 꼭 적어 주세요.'
        : null

  function confirm() {
    if (!outsidePolicy) return onConfirm(null)
    if (!reason || (reason === 'other' && !memo.trim())) return setInvalid(true)
    onConfirm({ reason, memo: memo.trim() })
  }

  return (
    <Dialog
      open
      title={outsidePolicy ? '예외로 환불할까요?' : '환불할까요?'}
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            취소
          </Button>
          <Button variant="primary" onClick={confirm} disabled={busy}>
            {busy
              ? '환불하는 중…'
              : `${formatKrw(request.payment.amount)} 환불하기`}
          </Button>
        </>
      }
    >
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted">
        <li>토스페이먼츠 결제({request.payment.orderId})가 전액 취소돼요.</li>
        <li>{diaryOutcome(request.payment.diary)}</li>
        <li>{request.author.email}로 환불 완료 메일이 가요.</li>
        <li>되돌릴 수 없어요.</li>
      </ul>

      {outsidePolicy && (
        <fieldset className="mt-5 flex flex-col gap-2">
          <legend className="mb-2 text-sm font-bold">
            예외 사유 <span className="text-point-strong">*</span>
            <span className="ml-1 text-xs font-normal text-sub">
              환불 정책 밖이라 사유가 기록돼요.
            </span>
          </legend>
          {EXCEPTION_REASONS.map((r) => (
            <label
              key={r.id}
              className="flex cursor-pointer items-start gap-2 rounded-lg border border-border px-3 py-2 text-sm has-checked:border-point has-checked:bg-point-soft/50"
            >
              <input
                type="radio"
                name="exception"
                checked={reason === r.id}
                onChange={() => setReason(r.id)}
                className="mt-0.5 accent-point-strong"
              />
              <span>
                {r.label}
                {r.article && (
                  <span className="ml-1.5 text-xs text-sub">{r.article}</span>
                )}
              </span>
            </label>
          ))}
          <textarea
            aria-label="예외 사유 메모"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            rows={3}
            maxLength={500}
            placeholder={
              reason === 'other'
                ? '어떤 판단으로 환불하는지 적어 주세요 (필수)'
                : '확인한 내용을 남겨 두면 좋아요 (예: 토스에서 중복 결제 확인)'
            }
            aria-invalid={invalid && reason === 'other' && !memo.trim()}
            className={`${inputClass} mt-1 resize-y py-2`}
          />
          {problem && (
            <p role="alert" className="text-xs font-medium text-danger">
              {problem}
            </p>
          )}
        </fieldset>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </Dialog>
  )
}

const REJECT_TEMPLATES = [
  {
    label: '7일 지남',
    text: '결제일로부터 7일이 지나 환불 정책 제3조 5항에 따라 환불되지 않아요.',
  },
  {
    label: '결제 후 편집함',
    text: '결제 후 편집을 시작한 다이어리라 환불 정책 제3조 2항에 따라 검토한 결과, 환불되지 않아요.',
  },
  {
    label: '완성함',
    text: '완성(Done)한 다이어리는 환불 정책 제4조에 따라 환불되지 않아요.',
  },
]

// Rejects with a reason that's emailed to the member.
export function RejectDialog({ request, busy, onConfirm, onClose }) {
  const [reason, setReason] = useState('')

  return (
    <Dialog
      open
      title="환불을 거절할까요?"
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            취소
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(reason.trim())}
            disabled={busy || !reason.trim()}
          >
            {busy ? '보내는 중…' : '거절하고 메일 보내기'}
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-muted">
        아래 사유가 {request.author.email}로 메일로 가요. 결제는 그대로예요.
      </p>
      <div className="mb-2 flex gap-1.5">
        {REJECT_TEMPLATES.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setReason(t.text)}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted hover:bg-chip"
          >
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        aria-label="거절 사유"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={4}
        maxLength={1000}
        placeholder="거절 사유 (회원에게 보내져요)"
        className={`${inputClass} resize-y py-2`}
      />
    </Dialog>
  )
}
