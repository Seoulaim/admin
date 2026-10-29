// Plan satisfaction survey: question kinds and how answers add up.

export const QUESTION_TYPES = [
  { id: 'rating', label: '별점 (1~5)' },
  { id: 'single', label: '하나 고르기' },
  { id: 'multiple', label: '여러 개 고르기' },
  { id: 'text', label: '주관식' },
]

export const hasOptions = (type) => type === 'single' || type === 'multiple'

export const RATINGS = [5, 4, 3, 2, 1]

// What one question's answers add up to:
// - rating: { count, average, counts: { 1…5: n } }
// - single / multiple: { count, counts: { [optionId]: n } } (multiple: a
//   response can count for several options)
// - text: { count, texts: [{ responseId, nickname, submittedAt, text }] }
// count: responses that answered it.
export function summarizeQuestion(question, responses) {
  const answered = responses.filter((r) => {
    const a = r.answers[question.id]
    return a != null && a !== '' && !(Array.isArray(a) && a.length === 0)
  })
  const count = answered.length
  if (question.type === 'rating') {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let sum = 0
    for (const r of answered) {
      counts[r.answers[question.id]]++
      sum += r.answers[question.id]
    }
    return { count, average: count ? sum / count : null, counts }
  }
  if (question.type === 'text') {
    return {
      count,
      texts: answered
        .map((r) => ({
          responseId: r.id,
          nickname: r.nickname,
          memberId: r.memberId,
          submittedAt: r.submittedAt,
          text: r.answers[question.id],
        }))
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    }
  }
  const counts = Object.fromEntries(question.options.map((o) => [o.id, 0]))
  for (const r of answered) {
    for (const id of [r.answers[question.id]].flat()) {
      if (id in counts) counts[id]++
    }
  }
  return { count, counts }
}

// The headline score: the average of the first rating question.
export function headlineRating(questions, responses) {
  const first = questions.find((q) => q.type === 'rating' && !q.archived)
  return first ? summarizeQuestion(first, responses).average : null
}
