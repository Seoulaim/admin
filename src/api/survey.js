import { isDateInRange, seoulDateKey } from '../lib/dates.js'
import { popupStats, responses, survey } from '../mocks/survey.js'
import { admin } from '../mocks/db.js'
import { ApiError, handle } from '../mocks/server.js'

// 만족도 조사: the plan satisfaction survey shown as a popup on the member
// app's TRAVEL tab (see mocks/survey.js for the shapes).
//
// The member app first shows the invite popup (survey.invite: title and
// body naming the reward — an Americano gift card to the account email);
// 예 opens the survey screen. Every response earns one gift card, sent to
// its email by the operator and marked here (markGiftsSent).
//
// survey.enabled turns the invite popup on / off (setSurveyEnabled);
// answers and results stay either way.
// When the member app shows the invite (the backend keeps the counts):
// - to members with a plan, from their 2nd TRAVEL visit after making it;
// - not after they answered (one plan per member, so one answer);
// - 닫기 (X): shown again on the next TRAVEL visit;
// - 오늘 하루 보지 않기: not again until midnight (Seoul).
// The app gets the questions that aren't archived, in order, localized.

// { questions, updatedAt, answerCounts: { [questionId]: n } }
export function getSurvey() {
  return handle(() => ({
    ...survey,
    answerCounts: Object.fromEntries(
      survey.questions.map((q) => [
        q.id,
        responses.filter((r) => r.answers[q.id] != null).length,
      ]),
    ),
  }))
}

// invite: { title, body } ({ en, ko, zh, ja }, en required).
// questions: the whole list in order. New ones (and new options) come
// without an id. A question that already has answers can't be dropped —
// archive it ('QUESTION_HAS_ANSWERS'). Every question needs an English
// title, choice questions 2+ options with English labels
// ('INVALID_SURVEY').
export function saveSurvey(questions, invite) {
  return handle(() => {
    const kept = new Set(questions.map((q) => q.id).filter(Boolean))
    const dropped = survey.questions.filter((q) => !kept.has(q.id))
    if (dropped.some((q) => responses.some((r) => r.answers[q.id] != null))) {
      throw new ApiError('QUESTION_HAS_ANSWERS')
    }
    const valid = questions.every(
      (q) =>
        q.title.en?.trim() &&
        (q.type !== 'single' && q.type !== 'multiple'
          ? true
          : q.options.length >= 2 &&
            q.options.every((o) => o.label.en?.trim())),
    )
    if (!valid || !invite.title.en?.trim() || !invite.body.en?.trim()) {
      throw new ApiError('INVALID_SURVEY')
    }
    survey.invite = invite
    const stamp = Date.now()
    survey.questions = questions.map((q, i) => ({
      ...q,
      id: q.id ?? `q-${stamp}-${i}`,
      options: q.options.map((o, j) => ({
        ...o,
        id: o.id ?? `o-${stamp}-${i}-${j}`,
      })),
    }))
    survey.updatedAt = new Date().toISOString()
    return survey
  }, 500)
}

// range: { from, to } (Seoul dates, '' = open). Resolves with
// { questions (archived ones too, for old answers), responses (newest
// first, in range), popup: { planCreators, responded, shown, closed,
// snoozed } } — popup counts are for all time.
// The backend could send the totals per question instead of every
// response once there are many (lib/survey.js shows what they are).
export function getSurveyResults(range) {
  return handle(() => ({
    questions: survey.questions,
    responses: responses
      .filter((r) => isDateInRange(seoulDateKey(r.submittedAt), range))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    popup: { ...popupStats, responded: responses.length },
  }))
}

// Marks the gift cards of these responses as sent (the operator sent them
// to each response's email). Resolves with the updated responses.
export function markGiftsSent(responseIds) {
  return handle(() => {
    const now = new Date().toISOString()
    return responses
      .filter((r) => responseIds.includes(r.id) && r.gift.status !== 'sent')
      .map((r) => {
        r.gift = { status: 'sent', sentAt: now, adminName: admin.name }
        return r
      })
  })
}

// Turns the invite popup on / off in the member app right away.
export function setSurveyEnabled(enabled) {
  return handle(() => {
    survey.enabled = enabled
    return { enabled }
  })
}
