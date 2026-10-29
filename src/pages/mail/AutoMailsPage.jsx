import { useState } from 'react'
import { getAutoMails, updateAutoMail } from '../../api/mail.js'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import Dialog from '../../components/Dialog.jsx'
import Field from '../../components/form/Field.jsx'
import LocalizedInput from '../../components/form/LocalizedInput.jsx'
import LoadError from '../../components/LoadError.jsx'
import Toast from '../../components/Toast.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import MailLayout from './MailLayout.jsx'

// Every {variable} the template had must stay (the backend fills them in).
function missingVariables(mail, subject, body) {
  const text = Object.values(subject).join(' ') + Object.values(body).join(' ')
  const used = mail.variables.filter((v) =>
    [mail.subject.en, mail.body.en].some((t) => t.includes(`{${v}}`)),
  )
  return used.filter((v) => !text.includes(`{${v}}`))
}

function AutoMailDialog({ mail, onSave, onClose }) {
  const [subject, setSubject] = useState(mail.subject)
  const [body, setBody] = useState(mail.body)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!subject.en?.trim() || !body.en?.trim())
      return setError('영어 제목과 내용은 꼭 있어야 해요.')
    const missing = missingVariables(mail, { en: subject.en }, { en: body.en })
    if (missing.length > 0) {
      return setError(
        `영어 문구에 ${missing.map((v) => `{${v}}`).join(', ')}이(가) 빠졌어요.`,
      )
    }
    setBusy(true)
    if (!(await onSave({ subject, body }))) setBusy(false)
  }

  return (
    <Dialog
      open
      title={mail.name}
      onClose={onClose}
      className="max-w-2xl"
      footer={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            저장
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm text-muted">
          보내는 때: {mail.trigger}. 회원의 메일 수신 설정과 관계없이 항상 가요.
        </p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-bold text-sub">바뀌는 값</span>
          {mail.variables.map((v) => (
            <code key={v} className="rounded bg-chip px-1.5 py-0.5 text-muted">
              {`{${v}}`}
            </code>
          ))}
        </div>
        <Field label="제목" required>
          <LocalizedInput
            id="autoSubject"
            required
            value={subject}
            onChange={setSubject}
          />
        </Field>
        <Field label="내용" required>
          <LocalizedInput
            id="autoBody"
            required
            multiline
            rows={4}
            value={body}
            onChange={setBody}
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  )
}

// 공지 관리 › 자동 메일: mails the backend sends on its own (code, payment,
// refund, answer …). They always go out; the admin edits their wording.
function AutoMailsPage() {
  const { data: mails, error, reload, update } = useFetch(getAutoMails)
  const { toast, showToast } = useToast()
  const [editing, setEditing] = useState(null)

  async function save(fields) {
    try {
      const next = await updateAutoMail(editing.id, fields)
      update((list) => list.map((m) => (m.id === next.id ? next : m)))
      setEditing(null)
      showToast('저장했어요.')
      return true
    } catch {
      showToast('저장하지 못했어요. 다시 시도해 주세요.')
      return false
    }
  }

  return (
    <MailLayout>
      <main className="flex max-w-5xl flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted">
          결제·환불·인증처럼 회원이 꼭 받아야 하는 메일이에요. 백엔드가 그때그때
          자동으로 보내고, 메일 수신 설정과 관계없이 가요. 여기서는 문구만
          고쳐요.
        </p>
        <Card className="overflow-hidden">
          {error ? (
            <LoadError onRetry={reload} className="py-20" />
          ) : !mails ? (
            <p className="py-20 text-center text-sm text-sub">불러오는 중…</p>
          ) : (
            <ul className="divide-y divide-border">
              {mails.map((mail) => (
                <li
                  key={mail.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5"
                >
                  <div className="min-w-0 flex-1 basis-60">
                    <p className="text-sm font-bold">
                      {mail.name}
                      <Chip
                        tone="bg-ok-soft text-ok"
                        className="ml-2 text-[11px]"
                      >
                        항상 발송
                      </Chip>
                    </p>
                    <p className="truncate text-xs text-sub">{mail.trigger}</p>
                  </div>
                  <span className="text-xs text-sub tabular-nums">
                    최근 30일 {mail.sentLast30Days}건
                  </span>
                  <Button size="sm" onClick={() => setEditing(mail)}>
                    문구 수정
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
      {editing && (
        <AutoMailDialog
          mail={editing}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      <Toast toast={toast} />
    </MailLayout>
  )
}

export default AutoMailsPage
