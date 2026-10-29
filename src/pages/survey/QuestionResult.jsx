import { useState } from 'react'
import { Link } from 'react-router'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import { formatDateTime } from '../../lib/dates.js'
import { pickText } from '../../lib/events.js'
import { QUESTION_TYPES, RATINGS, summarizeQuestion } from '../../lib/survey.js'

const SHOWN_TEXTS = 5

// One answer bar: label, a thin bar (share of answers) and the count / %.
function Bar({ label, count, total }) {
  const share = total ? count / total : 0
  return (
    <li className="grid grid-cols-[minmax(5rem,9rem)_1fr_auto] items-center gap-3 text-sm">
      <span className="truncate text-muted">{label}</span>
      <span className="h-2.5 overflow-hidden rounded-full bg-chip">
        <span
          style={{ width: `${share * 100}%` }}
          className="block h-full rounded-full bg-point-strong"
        />
      </span>
      <span className="w-20 text-right text-xs text-sub tabular-nums">
        {count}명 · {Math.round(share * 100)}%
      </span>
    </li>
  )
}

// What one question's answers add up to, drawn for its type.
function QuestionResult({ question, index, responses }) {
  const [allTexts, setAllTexts] = useState(false)
  const result = summarizeQuestion(question, responses)
  const typeLabel = QUESTION_TYPES.find((t) => t.id === question.type)?.label

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <p className="flex flex-wrap items-center gap-2 text-xs text-sub">
          <span className="font-bold tabular-nums">Q{index + 1}</span>
          {typeLabel} · 응답 {result.count}명
          {question.archived && <Chip>숨긴 질문</Chip>}
        </p>
        <h3 className="mt-1 font-bold">{pickText(question.title)}</h3>
      </div>

      {question.type === 'rating' && (
        <>
          <p className="text-3xl font-bold tabular-nums">
            {result.average == null ? '-' : result.average.toFixed(1)}
            <span className="ml-1 text-base font-medium text-sub">/ 5</span>
          </p>
          <ul className="flex flex-col gap-1.5">
            {RATINGS.map((n) => (
              <Bar
                key={n}
                label={`${'★'.repeat(n)}`}
                count={result.counts[n]}
                total={result.count}
              />
            ))}
          </ul>
        </>
      )}

      {(question.type === 'single' || question.type === 'multiple') && (
        <ul className="flex flex-col gap-1.5">
          {question.options.map((o) => (
            <Bar
              key={o.id}
              label={pickText(o.label)}
              count={result.counts[o.id]}
              total={result.count}
            />
          ))}
          {question.type === 'multiple' && (
            <li className="text-xs text-sub">
              여러 개를 고를 수 있어 합이 100%를 넘을 수 있어요.
            </li>
          )}
        </ul>
      )}

      {question.type === 'text' &&
        (result.texts.length === 0 ? (
          <p className="text-sm text-sub">아직 남긴 말이 없어요.</p>
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-border">
              {(allTexts
                ? result.texts
                : result.texts.slice(0, SHOWN_TEXTS)
              ).map((t) => (
                <li key={t.responseId} className="py-2.5">
                  <p className="text-sm whitespace-pre-line">{t.text}</p>
                  <p className="mt-1 text-xs text-sub">
                    <Link
                      to={`/members/${t.memberId}`}
                      className="font-semibold hover:underline"
                    >
                      {t.nickname}
                    </Link>{' '}
                    · {formatDateTime(t.submittedAt)}
                  </p>
                </li>
              ))}
            </ul>
            {result.texts.length > SHOWN_TEXTS && (
              <button
                type="button"
                onClick={() => setAllTexts((on) => !on)}
                className="self-start text-sm font-semibold text-muted hover:text-text"
              >
                {allTexts ? '접기' : `모두 보기 (${result.texts.length})`}
              </button>
            )}
          </>
        ))}
    </Card>
  )
}

export default QuestionResult
