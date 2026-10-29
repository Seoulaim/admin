import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { getGroups } from '../../api/artists.js'
import { getKeywords } from '../../api/places.js'
import { getSurveyResults, markGiftsSent } from '../../api/survey.js'
import Button from '../../components/Button.jsx'
import Chip from '../../components/Chip.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Toast from '../../components/Toast.jsx'
import { useToast } from '../../hooks/useToast.js'
import Card from '../../components/Card.jsx'
import DateRangeFilter from '../../components/form/DateRangeFilter.jsx'
import LoadError from '../../components/LoadError.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { formatDateTime, formatShortDate } from '../../lib/dates.js'
import { pickText } from '../../lib/events.js'
import { headlineRating } from '../../lib/survey.js'
import StatCard from '../dashboard/StatCard.jsx'
import QuestionResult from './QuestionResult.jsx'
import SurveyLayout from './SurveyLayout.jsx'

// 만족도 조사 › 결과: totals, each question's answers, and every response
// with the plan it was about.
function SurveyResultsPage() {
  const [range, setRange] = useState({ from: '', to: '' })
  const fetcher = useCallback(
    () =>
      Promise.all([getSurveyResults(range), getGroups(), getKeywords()]).then(
        ([results, groups, keywords]) => ({ ...results, groups, keywords }),
      ),
    [range],
  )
  const { data, error, reload, update } = useFetch(fetcher)
  const { toast, showToast } = useToast()

  return (
    <SurveyLayout>
      <main className="flex flex-col gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8">
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <span className="text-xs font-bold text-sub">응답일</span>
          <DateRangeFilter value={range} onChange={setRange} />
        </Card>
        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : !data ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : (
          <Results
            data={data}
            onToast={showToast}
            onGiftsSent={(sent) =>
              update((d) => ({
                ...d,
                responses: d.responses.map(
                  (r) => sent.find((x) => x.id === r.id) ?? r,
                ),
              }))
            }
          />
        )}
      </main>
      <Toast toast={toast} />
    </SurveyLayout>
  )
}

function Results({ data, onGiftsSent, onToast }) {
  const [pendingOnly, setPendingOnly] = useState(false)
  const [picked, setPicked] = useState(() => new Set())
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const pending = data.responses.filter((r) => r.gift.status === 'pending')
  const rows = pendingOnly ? pending : data.responses
  const toggle = (id) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  async function markSent() {
    setBusy(true)
    try {
      const sent = await markGiftsSent([...picked])
      onGiftsSent(sent)
      setPicked(new Set())
      onToast(`기프티콘 ${sent.length}건을 발송 완료로 표시했어요.`)
    } catch {
      onToast('표시하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  const { questions, responses, popup } = data
  const rating = headlineRating(questions, responses)
  const ratingQuestion = questions.find(
    (q) => q.type === 'rating' && !q.archived,
  )
  const textQuestion = questions.find((q) => q.type === 'text' && !q.archived)
  // Archived questions only when someone answered them in this range.
  const shown = questions.filter(
    (q) => !q.archived || responses.some((r) => r.answers[q.id] != null),
  )
  const groupNames = (ids) =>
    ids
      .map((id) => data.groups.find((g) => g.id === id)?.name.en ?? id)
      .join(', ')
  const keywordNames = (ids) =>
    ids
      .map((id) => pickText(data.keywords.find((k) => k.id === id)?.name) || id)
      .join(', ')

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:gap-6 xl:grid-cols-4">
        <StatCard
          label="응답"
          value={`${responses.length}건`}
          note="고른 기간"
        />
        <StatCard
          label="평균 만족도"
          value={rating == null ? '-' : `${rating.toFixed(1)} / 5`}
          note={
            ratingQuestion
              ? pickText(ratingQuestion.title)
              : '별점 질문이 없어요'
          }
        />
        <StatCard
          label="응답률 (전체 기간)"
          value={`${Math.round((popup.planCreators ? popup.responded / popup.planCreators : 0) * 100)}%`}
          note={`플랜 만든 회원 ${popup.planCreators}명 중 ${popup.responded}명`}
        />
        <StatCard
          label="팝업 (전체 기간)"
          value={`${popup.shown}회`}
          note={`닫기 ${popup.closed} · 오늘 하루 보지 않기 ${popup.snoozed}`}
        />
      </div>

      {responses.length === 0 ? (
        <Card className="py-20 text-center text-sm text-sub">
          이 기간에 들어온 응답이 없어요.
        </Card>
      ) : (
        <>
          <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-6">
            {shown.map((question, index) => (
              <QuestionResult
                key={question.id}
                question={question}
                index={index}
                responses={responses}
              />
            ))}
          </div>

          <Card className="overflow-x-auto">
            <div className="flex flex-wrap items-center gap-3 px-5 pt-5 pb-3">
              <h2 className="text-base font-bold">응답 {responses.length}건</h2>
              <Chip
                tone={
                  pending.length
                    ? 'bg-warn-soft text-warn'
                    : 'bg-ok-soft text-ok'
                }
              >
                기프티콘 미발송 {pending.length}건
              </Chip>
              <label className="flex items-center gap-1.5 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={pendingOnly}
                  onChange={(event) => setPendingOnly(event.target.checked)}
                  className="size-4 accent-point-strong"
                />
                미발송만 보기
              </label>
              <Button
                variant="primary"
                size="sm"
                className="ml-auto"
                onClick={() => setConfirming(true)}
                disabled={picked.size === 0}
              >
                선택한 {picked.size}건 발송 완료로 표시
              </Button>
            </div>
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-y border-border bg-panel text-left text-xs text-sub">
                <tr>
                  <th className="w-10 px-4 py-2.5">
                    <span className="sr-only">선택</span>
                  </th>
                  {[
                    '응답일',
                    '회원',
                    '여행 기간',
                    '최애 그룹',
                    '키워드',
                    '만족도',
                    '남긴 말',
                    '기프티콘',
                  ].map((h) => (
                    <th key={h} className="px-4 py-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="align-top hover:bg-chip/40">
                    <td className="px-4 py-3">
                      {r.gift.status === 'pending' && (
                        <input
                          type="checkbox"
                          aria-label={`${r.nickname} 선택`}
                          checked={picked.has(r.id)}
                          onChange={() => toggle(r.id)}
                          className="size-4 accent-point-strong"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-sub tabular-nums">
                      {formatDateTime(r.submittedAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        to={`/members/${r.memberId}`}
                        className="font-semibold hover:underline"
                      >
                        {r.nickname}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap tabular-nums">
                      {formatShortDate(r.plan.arrivalDate)} ~{' '}
                      {formatShortDate(r.plan.departureDate)}
                    </td>
                    <td className="max-w-40 px-4 py-3 text-muted">
                      {groupNames(r.plan.biasGroupIds)}
                    </td>
                    <td className="max-w-48 px-4 py-3 text-muted">
                      {keywordNames(r.plan.keywordIds)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-point-strong">
                      {ratingQuestion &&
                        '★'.repeat(r.answers[ratingQuestion.id] ?? 0)}
                    </td>
                    <td className="max-w-64 px-4 py-3 text-muted">
                      {textQuestion ? r.answers[textQuestion.id] || '-' : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {r.gift.status === 'sent' ? (
                        <Chip tone="bg-ok-soft text-ok">
                          발송 {formatShortDate(r.gift.sentAt.slice(0, 10))}
                        </Chip>
                      ) : (
                        <Chip tone="bg-warn-soft text-warn">미발송</Chip>
                      )}
                      <p className="mt-1 text-sub">{r.email}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
      <ConfirmDialog
        open={confirming}
        title="발송 완료로 표시할까요?"
        message={`선택한 ${picked.size}명에게 기프티콘을 보냈다고 기록해요. 각 응답의 이메일로 실제로 보냈는지 먼저 확인해 주세요.`}
        confirmLabel="표시"
        busy={busy}
        onConfirm={markSent}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}

export default SurveyResultsPage
