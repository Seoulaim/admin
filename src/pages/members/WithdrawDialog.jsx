import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { getWithdrawalChecks } from '../../api/members.js'
import Button from '../../components/Button.jsx'
import Dialog from '../../components/Dialog.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import { useFetch } from '../../hooks/useFetch.js'
import { WITHDRAWAL_REASONS } from '../../lib/members.js'

// 강퇴: reason + memo, with what to settle first (waiting refund requests,
// payments still in the refund period).
function WithdrawDialog({ member, busy, onConfirm, onClose }) {
  const fetcher = useCallback(() => getWithdrawalChecks(member.id), [member.id])
  const { data: checks } = useFetch(fetcher)
  const [reason, setReason] = useState(null)
  const [memo, setMemo] = useState('')
  const [typed, setTyped] = useState('')
  const ready = reason && memo.trim() && typed === member.nickname

  return (
    <Dialog
      open
      title={`${member.nickname} 회원을 강퇴할까요?`}
      onClose={busy ? () => {} : onClose}
      className="max-w-xl"
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            취소
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(reason, memo.trim())}
            disabled={busy || !ready}
          >
            {busy ? '처리 중…' : '강퇴하기'}
          </Button>
        </>
      }
    >
      <ul className="mb-4 flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted">
        <li>
          계정과 다이어리, 등록 사진, 여행 플랜이 삭제되고 되돌릴 수 없어요.
        </li>
        <li>결제 기록은 전자상거래법에 따라 5년 동안 보관돼요.</li>
        <li>{member.email}로 탈퇴 안내 메일이 가요 (사유 포함).</li>
        <li>이용약관에 정한 사유에 해당할 때만 강퇴할 수 있어요.</li>
      </ul>

      {checks && (checks.pendingRefunds > 0 || checks.recentPayments > 0) && (
        <div className="mb-4 rounded-xl bg-warn-soft p-3 text-sm text-warn">
          {checks.pendingRefunds > 0 && (
            <p>
              처리 안 된 환불 요청이 {checks.pendingRefunds}건 있어요.{' '}
              <Link to="/refunds" className="font-semibold underline">
                환불 관리에서 먼저 처리
              </Link>
              하는 걸 권해요.
            </p>
          )}
          {checks.recentPayments > 0 && (
            <p>
              7일 안에 결제한 내역이 {checks.recentPayments}건 있어요. 강퇴해도
              자동으로 환불되지 않아요.
            </p>
          )}
        </div>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">
          사유 <span className="text-point-strong">*</span>
        </legend>
        {WITHDRAWAL_REASONS.map((r) => (
          <label
            key={r.id}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-checked:border-point has-checked:bg-point-soft/50"
          >
            <input
              type="radio"
              name="withdraw-reason"
              checked={reason === r.id}
              onChange={() => setReason(r.id)}
              className="accent-point-strong"
            />
            {r.label}
          </label>
        ))}
      </fieldset>
      <textarea
        aria-label="강퇴 사유 설명"
        value={memo}
        onChange={(event) => setMemo(event.target.value)}
        rows={3}
        maxLength={500}
        placeholder="무슨 일이 있었는지 적어 주세요 (기록되고, 회원에게 보내는 메일에도 들어가요)"
        className={`${inputClass} mt-3 resize-y py-2`}
      />
      <label className="mt-4 flex flex-col gap-1.5 text-sm">
        <span>
          확인을 위해 닉네임 <b>{member.nickname}</b>을(를) 입력하세요
        </span>
        <input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          className={`${inputClass} h-10`}
        />
      </label>
    </Dialog>
  )
}

export default WithdrawDialog
