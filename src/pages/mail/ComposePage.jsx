import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { getGroups } from '../../api/artists.js'
import {
  countRecipients,
  getCampaign,
  saveCampaign,
  searchMembers,
  sendTestMail,
} from '../../api/mail.js'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import ChoiceGroup from '../../components/form/ChoiceGroup.jsx'
import Field from '../../components/form/Field.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import LocalizedInput from '../../components/form/LocalizedInput.jsx'
import LoadError from '../../components/LoadError.jsx'
import Toast from '../../components/Toast.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import { formatDateTime } from '../../lib/dates.js'
import { isNight } from '../../lib/mailRules.js'
import MailLayout from './MailLayout.jsx'
import { MAIL_KINDS } from './mailKinds.js'
import MailPreview from './MailPreview.jsx'

const emptyMail = () => ({
  kind: 'marketing',
  subject: {},
  body: {},
  audience: { type: 'all', groupIds: [], memberIds: [] },
})

// Members picked for a notice to specific people.
function MemberSearch({ picked, onChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    let ignore = false
    searchMembers(query).then((found) => !ignore && setResults(found))
    return () => {
      ignore = true
    }
  }, [query])

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="search"
          aria-label="회원 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="닉네임·이메일로 찾기"
          className={`${inputClass} h-10`}
        />
        {results.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-10 mt-1 rounded-lg border border-border bg-white py-1 shadow-lg">
            {results.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!picked.some((p) => p.id === m.id))
                      onChange([...picked, m])
                    setQuery('')
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-chip"
                >
                  {m.nickname} <span className="text-sub">{m.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {picked.map((m) => (
          <span
            key={m.id}
            className="flex h-8 items-center gap-1 rounded-full bg-point-soft pr-1.5 pl-3 text-[13px] font-semibold text-point-strong"
          >
            {m.nickname}
            <button
              type="button"
              aria-label={`${m.nickname} 빼기`}
              onClick={() => onChange(picked.filter((p) => p.id !== m.id))}
              className="flex size-5 items-center justify-center rounded-full hover:bg-white/70"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

// 공지 관리 › 메일 보내기 (/mail, or /mail?draft=id to continue a draft).
function ComposePage() {
  const [searchParams] = useSearchParams()
  const draftId = searchParams.get('draft')
  const fetcher = useCallback(
    () =>
      Promise.all([getGroups(), draftId ? getCampaign(draftId) : null]).then(
        ([groups, draft]) => ({ groups, draft }),
      ),
    [draftId],
  )
  const { data, error, reload } = useFetch(fetcher)

  return (
    <MailLayout>
      <main className="p-4 sm:p-6 lg:p-8">
        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : !data ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : (
          <ComposeForm
            key={draftId ?? 'new'}
            groups={data.groups}
            draft={data.draft}
          />
        )}
      </main>
    </MailLayout>
  )
}

function ComposeForm({ groups, draft }) {
  const navigate = useNavigate()
  const { toast, showToast } = useToast()
  const [form, setForm] = useState(() =>
    draft ? structuredClone(draft) : emptyMail(),
  )
  const [picked, setPicked] = useState([]) // members, for 'members'
  const [when, setWhen] = useState('now') // 'now' | 'schedule'
  const [scheduledAt, setScheduledAt] = useState('')
  const [count, setCount] = useState(null)
  const [errors, setErrors] = useState({})
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const marketing = form.kind === 'marketing'
  const audience = { ...form.audience, memberIds: picked.map((m) => m.id) }
  const audienceKey = JSON.stringify([form.kind, audience])

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }))
  const setAudience = (changes) =>
    setForm((prev) => ({ ...prev, audience: { ...prev.audience, ...changes } }))

  useEffect(() => {
    let ignore = false
    const [kind, current] = JSON.parse(audienceKey)
    countRecipients(kind, current).then((c) => !ignore && setCount(c))
    return () => {
      ignore = true
    }
  }, [audienceKey])

  // The scheduled time as ISO (the admin's clock is assumed to be Seoul's).
  const scheduledIso = scheduledAt ? new Date(scheduledAt).toISOString() : null
  const sendAt = when === 'schedule' ? scheduledIso : new Date().toISOString()
  const nightBlocked = marketing && sendAt && isNight(sendAt)

  function validate(sending) {
    const found = {}
    if (!form.subject.en?.trim())
      found.subject = '영어 제목은 꼭 입력해 주세요.'
    if (!form.body.en?.trim()) found.body = '영어 내용은 꼭 입력해 주세요.'
    if (sending) {
      if (
        form.audience.type === 'groups' &&
        form.audience.groupIds.length === 0
      ) {
        found.audience = '그룹을 하나 이상 골라 주세요.'
      }
      if (form.audience.type === 'members' && picked.length === 0) {
        found.audience = '받을 회원을 골라 주세요.'
      }
      if (
        when === 'schedule' &&
        (!scheduledIso || scheduledIso < new Date().toISOString())
      ) {
        found.when = '지금 이후의 예약 시각을 골라 주세요.'
      }
    }
    setErrors(found)
    return Object.keys(found).length === 0
  }

  const fields = () => ({
    kind: form.kind,
    subject: form.subject,
    body: form.body,
    audience,
  })

  async function save(mode) {
    setBusy(true)
    try {
      const saved = await saveCampaign(form.id, fields(), mode, scheduledIso)
      if (mode === 'draft') {
        setForm((prev) => ({ ...prev, id: saved.id }))
        showToast('임시저장했어요.')
      } else {
        navigate('/mail/history', {
          state: {
            toast:
              mode === 'send'
                ? `${saved.recipients}명에게 보냈어요.`
                : `${formatDateTime(saved.scheduledAt)}에 보내도록 예약했어요.`,
          },
        })
      }
    } catch (e) {
      showToast(
        e.code === 'NIGHT_MARKETING'
          ? '밤 9시~아침 8시에는 홍보 메일을 보낼 수 없어요.'
          : e.code === 'NO_RECIPIENTS'
            ? '받을 회원이 없어요.'
            : '저장하지 못했어요. 다시 시도해 주세요.',
      )
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  async function test() {
    if (!validate(false)) return
    const result = await sendTestMail(fields(), 'en')
    showToast(`${result.to}로 테스트 메일을 보냈어요.`)
  }

  return (
    <div className="grid items-start gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card className="flex flex-col gap-7 p-5 sm:p-8">
        <Field label="종류" required hint={MAIL_KINDS[form.kind].hint}>
          <ChoiceGroup
            name="kind"
            options={Object.entries(MAIL_KINDS).map(([id, k]) => ({
              id,
              label: k.label,
            }))}
            value={form.kind}
            onChange={(kind) => {
              set('kind')(kind)
              if (kind === 'marketing' && form.audience.type === 'members') {
                setAudience({ type: 'all' })
              }
            }}
          />
        </Field>

        <Field label="받는 사람" required error={errors.audience}>
          <ChoiceGroup
            name="audience"
            options={[
              {
                id: 'all',
                label: marketing ? '수신 동의 회원 전체' : '회원 전체',
              },
              { id: 'groups', label: '최애 그룹으로 고르기' },
              ...(marketing ? [] : [{ id: 'members', label: '특정 회원' }]),
            ]}
            value={form.audience.type}
            onChange={(type) => setAudience({ type })}
          />
          {form.audience.type === 'groups' && (
            <div className="flex flex-wrap gap-1.5">
              {groups.map((group) => {
                const on = form.audience.groupIds.includes(group.id)
                return (
                  <button
                    key={group.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setAudience({
                        groupIds: on
                          ? form.audience.groupIds.filter((g) => g !== group.id)
                          : [...form.audience.groupIds, group.id],
                      })
                    }
                    className={`h-8 rounded-full border px-3 text-[13px] font-semibold ${on ? 'border-point bg-point-soft text-point-strong' : 'border-border text-muted hover:bg-chip'}`}
                  >
                    {group.name.en}
                  </button>
                )
              })}
            </div>
          )}
          {form.audience.type === 'members' && (
            <MemberSearch picked={picked} onChange={setPicked} />
          )}
          <p className="text-sm">
            받을 회원{' '}
            <b className="text-point-strong tabular-nums">
              {count?.count ?? '…'}명
            </b>
            {marketing && (
              <span className="ml-1 text-xs text-sub">
                (마케팅 수신 동의한 회원만)
              </span>
            )}
          </p>
        </Field>

        <Field label="제목" required error={errors.subject}>
          {marketing && (
            <p className="text-xs text-sub">
              앞에 &lsquo;(광고)&rsquo;가 자동으로 붙어요.
            </p>
          )}
          <LocalizedInput
            id="mailSubject"
            required
            value={form.subject}
            onChange={set('subject')}
            invalid={Boolean(errors.subject)}
            maxLength={80}
          />
        </Field>

        <Field label="내용" required error={errors.body}>
          <LocalizedInput
            id="mailBody"
            required
            multiline
            rows={6}
            value={form.body}
            onChange={set('body')}
            invalid={Boolean(errors.body)}
            maxLength={5000}
          />
        </Field>

        <Field label="보내는 시각" required error={errors.when}>
          <ChoiceGroup
            name="when"
            options={[
              { id: 'now', label: '지금 보내기' },
              { id: 'schedule', label: '예약' },
            ]}
            value={when}
            onChange={setWhen}
          />
          {when === 'schedule' && (
            <input
              type="datetime-local"
              aria-label="예약 시각"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className={`${inputClass} h-10 max-w-64`}
            />
          )}
          {nightBlocked && (
            <p className="text-xs font-medium text-danger">
              밤 9시~아침 8시(한국 시간)에는 홍보 메일을 보낼 수 없어요.
              예약으로 아침 8시 이후를 골라 주세요.
            </p>
          )}
        </Field>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-5">
          <Button className="mr-auto" onClick={test} disabled={busy}>
            나에게 테스트 메일
          </Button>
          <Button
            onClick={() => validate(false) && save('draft')}
            disabled={busy}
          >
            임시저장
          </Button>
          <Button
            variant="primary"
            onClick={() => validate(true) && setConfirming(true)}
            disabled={busy || nightBlocked || count?.count === 0}
          >
            {when === 'schedule' ? '예약하기' : '보내기'}
          </Button>
        </div>
      </Card>

      <MailPreview
        kind={form.kind}
        subject={form.subject}
        body={form.body}
        byLanguage={count?.byLanguage}
      />

      <ConfirmDialog
        open={confirming}
        title={when === 'schedule' ? '예약할까요?' : '보낼까요?'}
        message={`${MAIL_KINDS[form.kind].label} · 회원 ${count?.count}명 · ${
          when === 'schedule'
            ? `${formatDateTime(scheduledIso)} 발송`
            : '지금 발송'
        }${when === 'now' ? '\n보낸 메일은 되돌릴 수 없어요.' : ''}`}
        confirmLabel={when === 'schedule' ? '예약' : '보내기'}
        busy={busy}
        onConfirm={() => save(when === 'schedule' ? 'schedule' : 'send')}
        onCancel={() => setConfirming(false)}
      />
      <Toast toast={toast} />
    </div>
  )
}

export default ComposePage
