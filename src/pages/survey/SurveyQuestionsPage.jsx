import { useState } from 'react'
import { flushSync } from 'react-dom'
import { useBlocker } from 'react-router'
import { getSurvey, saveSurvey } from '../../api/survey.js'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import LocalizedInput from '../../components/form/LocalizedInput.jsx'
import LoadError from '../../components/LoadError.jsx'
import MoveButtons from '../../components/MoveButtons.jsx'
import Toast from '../../components/Toast.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../hooks/useToast.js'
import { moveItem } from '../../lib/arrays.js'
import { formatDateTime } from '../../lib/dates.js'
import { hasOptions, QUESTION_TYPES } from '../../lib/survey.js'
import SurveyLayout from './SurveyLayout.jsx'
import SurveyPreview from './SurveyPreview.jsx'

// A stable React key per question / option (new ones have no id yet).
let nextKey = 0
const withKeys = (question) => ({
  ...question,
  key: nextKey++,
  options: question.options.map((o) => ({ ...o, key: nextKey++ })),
})
const newOption = () => ({ key: nextKey++, label: {} })
const newQuestion = () => ({
  key: nextKey++,
  type: 'single',
  title: {},
  required: false,
  options: [newOption(), newOption()],
  archived: false,
})

// Problems that block saving, by question key.
function problems(questions) {
  const found = {}
  for (const q of questions) {
    if (!q.title.en?.trim()) found[q.key] = '영어 질문은 꼭 입력해 주세요.'
    else if (hasOptions(q.type) && q.options.length < 2)
      found[q.key] = '보기는 2개 이상이어야 해요.'
    else if (hasOptions(q.type) && q.options.some((o) => !o.label.en?.trim())) {
      found[q.key] = '보기마다 영어 문구를 입력해 주세요.'
    }
  }
  return found
}

// 만족도 조사 › 질문 편집: the popup's questions, in order, in 4 languages.
function SurveyQuestionsPage() {
  const { data, error, reload } = useFetch(getSurvey)
  const { toast, showToast } = useToast()

  return (
    <SurveyLayout>
      <main className="p-4 sm:p-6 lg:p-8">
        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : !data ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : (
          <Editor
            key={data.updatedAt}
            survey={data}
            onSaved={reload}
            onToast={showToast}
          />
        )}
      </main>
      <Toast toast={toast} />
    </SurveyLayout>
  )
}

function Editor({ survey, onSaved, onToast }) {
  const [invite, setInvite] = useState(() => structuredClone(survey.invite))
  const [inviteInvalid, setInviteInvalid] = useState(false)
  const [questions, setQuestions] = useState(() =>
    survey.questions.map(withKeys),
  )
  const [dirty, setDirty] = useState(false)
  const [errors, setErrors] = useState({})
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  )
  const answered = (q) => q.id && survey.answerCounts[q.id] > 0

  const change = (fn) => {
    setDirty(true)
    setQuestions(fn)
  }
  const setQuestion = (key, changes) => {
    // Its error is checked again on the next save.
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    change((list) =>
      list.map((q) => (q.key === key ? { ...q, ...changes } : q)),
    )
  }

  function trySave() {
    const found = problems(questions)
    setErrors(found)
    const badInvite = !invite.title.en?.trim() || !invite.body.en?.trim()
    setInviteInvalid(badInvite)
    if (Object.keys(found).length > 0 || badInvite) return
    setConfirming(true)
  }

  async function save() {
    setBusy(true)
    try {
      await saveSurvey(
        questions.map((q) => ({
          id: q.id,
          type: q.type,
          title: q.title,
          required: q.required,
          archived: q.archived,
          options: hasOptions(q.type)
            ? q.options.map((o) => ({ id: o.id, label: o.label }))
            : [],
        })),
        invite,
      )
      flushSync(() => setDirty(false))
      onToast('저장했어요. 다음 팝업부터 바뀐 질문이 보여요.')
      onSaved()
    } catch (e) {
      onToast(
        e.code === 'QUESTION_HAS_ANSWERS'
          ? '응답이 있는 질문은 지울 수 없어요. 숨기기를 써 주세요.'
          : '저장하지 못했어요. 다시 시도해 주세요.',
      )
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <div className="grid items-start gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          플랜을 만든 회원이 TRAVEL에 두 번째로 들어올 때부터 안내 팝업이 떠요.
          &lsquo;예&rsquo;를 누르면 아래 질문이 있는 설문 화면으로 가요. 마지막
          저장 {formatDateTime(survey.updatedAt)}
        </p>
        <Card className="flex flex-col gap-4 p-5">
          <div>
            <h2 className="text-base font-bold">안내 팝업 문구</h2>
            <p className="mt-0.5 text-xs text-sub">
              참여 보상(기프티콘)을 바꾸면 여기 문구도 같이 고쳐 주세요.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-muted">제목</p>
            <LocalizedInput
              id="inviteTitle"
              required
              columns
              value={invite.title}
              onChange={(title) => {
                setDirty(true)
                setInvite((prev) => ({ ...prev, title }))
              }}
              invalid={inviteInvalid && !invite.title.en?.trim()}
              maxLength={60}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-muted">내용</p>
            <LocalizedInput
              id="inviteBody"
              required
              multiline
              value={invite.body}
              onChange={(body) => {
                setDirty(true)
                setInvite((prev) => ({ ...prev, body }))
              }}
              invalid={inviteInvalid && !invite.body.en?.trim()}
              maxLength={200}
            />
          </div>
          {inviteInvalid && (
            <p role="alert" className="text-xs font-medium text-danger">
              영어 제목과 내용은 꼭 입력해 주세요.
            </p>
          )}
        </Card>
        <h2 className="mt-2 text-base font-bold">설문 질문</h2>
        {questions.map((q, index) => (
          <Card
            key={q.key}
            className={`flex flex-col gap-4 p-5 ${q.archived ? 'opacity-60' : ''}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold tabular-nums">
                Q{index + 1}
              </span>
              <select
                aria-label="질문 종류"
                value={q.type}
                disabled={answered(q)}
                title={
                  answered(q)
                    ? '응답이 있어서 종류를 바꿀 수 없어요.'
                    : undefined
                }
                onChange={(event) =>
                  setQuestion(q.key, { type: event.target.value })
                }
                className={`${inputClass} h-9 max-w-44`}
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(event) =>
                    setQuestion(q.key, { required: event.target.checked })
                  }
                  className="size-4 accent-point-strong"
                />
                필수
              </label>
              {answered(q) && <Chip>응답 {survey.answerCounts[q.id]}건</Chip>}
              {q.archived && <Chip tone="bg-warn-soft text-warn">숨김</Chip>}
              <div className="ml-auto flex items-center gap-1.5">
                <MoveButtons
                  index={index}
                  count={questions.length}
                  onMove={(to) => change((list) => moveItem(list, index, to))}
                />
                {answered(q) ? (
                  <Button
                    size="sm"
                    onClick={() =>
                      setQuestion(q.key, { archived: !q.archived })
                    }
                  >
                    {q.archived ? '다시 보이기' : '숨기기'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      change((list) => list.filter((x) => x.key !== q.key))
                    }
                  >
                    삭제
                  </Button>
                )}
              </div>
            </div>
            <LocalizedInput
              id={`q-${q.key}`}
              required
              columns
              value={q.title}
              onChange={(title) => setQuestion(q.key, { title })}
              invalid={Boolean(errors[q.key]) && !q.title.en?.trim()}
              maxLength={100}
            />
            {hasOptions(q.type) && (
              <div className="flex flex-col gap-2 rounded-xl bg-panel p-3">
                <p className="text-xs font-bold text-sub">보기</p>
                {q.options.map((o, i) => (
                  <div key={o.key} className="flex items-start gap-2">
                    <span className="mt-2 w-5 text-xs text-sub tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <LocalizedInput
                        id={`o-${o.key}`}
                        required
                        columns
                        value={o.label}
                        onChange={(label) =>
                          setQuestion(q.key, {
                            options: q.options.map((x) =>
                              x.key === o.key ? { ...x, label } : x,
                            ),
                          })
                        }
                        maxLength={40}
                      />
                    </div>
                    <button
                      type="button"
                      aria-label={`보기 ${i + 1} 빼기`}
                      onClick={() =>
                        setQuestion(q.key, {
                          options: q.options.filter((x) => x.key !== o.key),
                        })
                      }
                      className="mt-1.5 px-1.5 text-lg text-sub hover:text-danger"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setQuestion(q.key, { options: [...q.options, newOption()] })
                  }
                  className="self-start text-sm font-semibold text-muted hover:text-text"
                >
                  + 보기 추가
                </button>
                {answered(q) && (
                  <p className="text-xs text-sub">
                    이미 받은 응답은 보기 id로 이어져 있어요. 문구는 고쳐도
                    되지만, 뜻이 바뀌면 새 질문으로 만드는 게 좋아요.
                  </p>
                )}
              </div>
            )}
            {errors[q.key] && (
              <p role="alert" className="text-xs font-medium text-danger">
                {errors[q.key]}
              </p>
            )}
          </Card>
        ))}
        <div className="flex items-center justify-between gap-2">
          <Button onClick={() => change((list) => [...list, newQuestion()])}>
            + 질문 추가
          </Button>
          <Button variant="primary" onClick={trySave} disabled={busy || !dirty}>
            {busy ? '저장 중…' : '저장'}
          </Button>
        </div>
      </div>

      <SurveyPreview invite={invite} questions={questions} />

      <ConfirmDialog
        open={confirming}
        title="질문을 저장할까요?"
        message="다음에 뜨는 팝업부터 바뀐 질문이 보여요. 이미 받은 응답은 그대로 남아요."
        confirmLabel="저장"
        busy={busy}
        onConfirm={save}
        onCancel={() => setConfirming(false)}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="저장하지 않고 나갈까요?"
        message="고친 질문이 사라져요."
        confirmLabel="나가기"
        danger
        onConfirm={() => blocker.proceed()}
        onCancel={() => blocker.reset()}
      />
    </div>
  )
}

export default SurveyQuestionsPage
