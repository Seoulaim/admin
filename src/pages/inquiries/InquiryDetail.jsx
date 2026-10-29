import { Link } from 'react-router'
import { useState } from 'react'
import { answerInquiry, saveInquiryMemo } from '../../api/inquiries.js'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import PhotoStrip from '../../components/PhotoStrip.jsx'
import { formatDateTime } from '../../lib/dates.js'
import { inquiryCategoryLabel } from '../../lib/inquiries.js'
import { languageName } from '../../lib/languages.js'

const MAX_ANSWER = 2000

// One inquiry: what the member wrote, answers already emailed, a new
// answer (sent to their email) and an admin-only memo.
function InquiryDetail({ inquiry, onChange, onToast }) {
  const [answer, setAnswer] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [memo, setMemo] = useState(inquiry.memo)
  const [savingMemo, setSavingMemo] = useState(false)
  const answered = inquiry.status === 'answered'

  async function send() {
    setSending(true)
    try {
      const updated = await answerInquiry(inquiry.id, answer.trim())
      onChange(updated)
      setAnswer('')
      onToast('답변을 메일로 보냈어요.')
    } catch {
      onToast('보내지 못했어요. 다시 시도해 주세요.')
    } finally {
      setSending(false)
      setConfirming(false)
    }
  }

  async function storeMemo() {
    setSavingMemo(true)
    try {
      await saveInquiryMemo(inquiry.id, memo.trim())
      onChange({ ...inquiry, memo: memo.trim() })
      onToast('메모를 저장했어요.')
    } catch {
      onToast('저장하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setSavingMemo(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Chip>{inquiryCategoryLabel(inquiry.category)}</Chip>
          <Chip
            tone={answered ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'}
          >
            {answered ? '답변 완료' : '답변 대기'}
          </Chip>
          <span className="ml-auto text-xs text-sub tabular-nums">
            {formatDateTime(inquiry.createdAt)}
          </span>
        </div>
        <h2 className="text-lg font-bold">{inquiry.title}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-sub">회원</dt>
          <dd>
            <Link
              to={`/members/${inquiry.author.id}`}
              className="font-semibold text-point-strong underline underline-offset-2"
            >
              {inquiry.author.nickname}
            </Link>{' '}
            <span className="text-xs text-sub">({inquiry.author.id})</span>
          </dd>
          <dt className="text-sub">이메일</dt>
          <dd>{inquiry.author.email}</dd>
          <dt className="text-sub">작성 언어</dt>
          <dd>{languageName(inquiry.language)}</dd>
        </dl>
        <p className="rounded-xl bg-panel p-4 text-sm leading-relaxed whitespace-pre-line">
          {inquiry.content}
        </p>
        <PhotoStrip urls={inquiry.photoUrls} />
      </Card>

      {inquiry.answers.length > 0 && (
        <Card className="flex flex-col gap-3 p-5 sm:p-6">
          <h3 className="text-sm font-bold">보낸 답변</h3>
          {inquiry.answers.map((a) => (
            <div key={a.id} className="rounded-xl border border-border p-4">
              <p className="mb-2 text-xs text-sub tabular-nums">
                {formatDateTime(a.sentAt)} · {a.adminName} ·{' '}
                {inquiry.author.email}로 보냄
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {a.body}
              </p>
            </div>
          ))}
        </Card>
      )}

      <Card className="flex flex-col gap-3 p-5 sm:p-6">
        <h3 className="text-sm font-bold">{answered ? '추가 답변' : '답변'}</h3>
        <p className="text-xs text-sub">
          {inquiry.author.email}로 메일이 가요. 회원이{' '}
          <b className="text-muted">{languageName(inquiry.language)}</b>로
          썼어요.
        </p>
        <textarea
          aria-label="답변"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          maxLength={MAX_ANSWER}
          rows={7}
          placeholder="답변을 입력하세요"
          className={`${inputClass} resize-y py-3 leading-relaxed`}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-sub tabular-nums">
            {answer.length}/{MAX_ANSWER}
          </span>
          <Button
            variant="primary"
            onClick={() => setConfirming(true)}
            disabled={!answer.trim()}
          >
            답변 보내기
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-5 sm:p-6">
        <h3 className="text-sm font-bold">
          관리자 메모{' '}
          <span className="text-xs font-normal text-sub">
            회원에게 보이지 않아요
          </span>
        </h3>
        <textarea
          aria-label="관리자 메모"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          rows={3}
          maxLength={500}
          className={`${inputClass} resize-y py-2`}
        />
        <Button
          size="sm"
          className="self-end"
          onClick={storeMemo}
          disabled={savingMemo || memo.trim() === inquiry.memo}
        >
          메모 저장
        </Button>
      </Card>

      <ConfirmDialog
        open={confirming}
        title="답변을 보낼까요?"
        message={`${inquiry.author.email}로 메일이 가요. 보낸 뒤에는 고칠 수 없어요.`}
        confirmLabel="보내기"
        busy={sending}
        onConfirm={send}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}

export default InquiryDetail
