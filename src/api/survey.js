import { ApiError } from '../lib/apiClient.js'
import {
  resultsFromApi,
  responseFromApi,
  surveyErrorCode,
  surveyFromApi,
  surveyToApi,
} from './adapters/survey.js'
import { request } from './client.js'

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
// - 닫기 (X), or 예 and leaving without submitting: shown again on the next
//   TRAVEL visit;
// - 오늘 하루 보지 않기: not again until midnight (Seoul).
// A TRAVEL visit is coming in from another screen (HOME, DIARY, menu…).
// Coming back from a place (HT07), the map (HT09) or the survey isn't one:
// the app doesn't report it, so after closing, the popup waits until the
// member leaves for another screen and enters TRAVEL again.
// The app gets the questions that aren't archived, in order, localized.

// 백엔드: /api/v1/admin/survey (domain/survey/admin, docs/survey-flow.md).
// 형태 변환은 adapters/survey.js.

// { enabled, invite, questions (archived 포함), updatedAt,
//   answerCounts: { [questionId]: n } }
export async function getSurvey() {
  return surveyFromApi(await request('/api/v1/admin/survey'))
}

// invite: { title, body } ({ en, ko, zh, ja }, en required).
// questions: the whole list in order. New ones (and new options) come
// without an id. A question that already has answers can't be dropped —
// archive it ('QUESTION_HAS_ANSWERS'). Every question needs an English
// title, choice questions 2+ options with English labels
// ('INVALID_SURVEY'). Resolves with the saved survey (getSurvey 형태).
export async function saveSurvey(questions, invite) {
  try {
    const saved = await request('/api/v1/admin/survey', {
      method: 'PUT',
      body: surveyToApi(questions, invite),
    })
    return surveyFromApi(saved)
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(surveyErrorCode(error.code), {
        status: error.status,
        details: error.details,
      })
    }
    throw error
  }
}

// range: { from, to } (Seoul dates, '' = open). Resolves with
// { questions (archived ones too, for old answers), responses (newest
// first, in range), popup: { planCreators, responded, shown, closed,
// accepted, snoozed } } — popup counts are for all time.
export async function getSurveyResults(range = {}) {
  const params = new URLSearchParams()
  if (range.from) params.set('from', range.from)
  if (range.to) params.set('to', range.to)
  const query = params.toString()
  const raw = await request(
    `/api/v1/admin/survey/responses${query ? `?${query}` : ''}`,
  )
  return resultsFromApi(raw)
}

// Marks the gift cards of these responses as sent (the operator sent them
// to each response's email). Resolves with the updated responses (이미
// 발송됐거나 없는 id 는 빠진다).
export async function markGiftsSent(responseIds) {
  const raw = await request('/api/v1/admin/survey/responses/gifts-sent', {
    method: 'POST',
    body: { responseIds },
  })
  return (raw ?? []).map(responseFromApi)
}

// Turns the invite popup on / off in the member app right away.
export async function setSurveyEnabled(enabled) {
  const raw = await request('/api/v1/admin/survey/enabled', {
    method: 'PATCH',
    body: { enabled },
  })
  return { enabled: Boolean(raw?.enabled) }
}
