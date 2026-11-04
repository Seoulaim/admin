// 백엔드 만족도 조사 DTO (domain/survey/admin) ↔ 화면 형태 (api/survey.js 참고).
//
// - 질문 type: 백엔드 대문자(RATING·SINGLE·MULTIPLE·TEXT) ↔ 화면 소문자.
// - 응답: userId → memberId, gift.status 대문자 → 소문자 (pending|sent),
//   gift.adminName 은 백엔드에 없음 → null.
// - plan: 백엔드 스냅숏 { planId, startDate, endDate, dayCount, placeCount }
//   그대로 두고, 화면이 읽는 필드를 덧붙인다:
//   arrivalDate·departureDate ← startDate·endDate,
//   biasGroupIds·keywordIds → [] (백엔드 스냅숏에 없음).
// - nickname: 백엔드에 없음 → email 로 대신 표시.

const text = (map) => ({ ...(map ?? {}) })

export function questionFromApi(raw) {
  return {
    id: raw.id,
    type: (raw.type ?? '').toLowerCase(),
    title: text(raw.title),
    required: Boolean(raw.required),
    archived: Boolean(raw.archived),
    options: (raw.options ?? []).map((o) => ({
      id: o.id,
      label: text(o.label),
    })),
  }
}

export function surveyFromApi(raw) {
  return {
    enabled: Boolean(raw.enabled),
    invite: {
      title: text(raw.invite?.title),
      body: text(raw.invite?.body),
    },
    questions: (raw.questions ?? []).map(questionFromApi),
    updatedAt: raw.updatedAt ?? null,
    answerCounts: { ...(raw.answerCounts ?? {}) },
  }
}

// AdminSurveyUpdateRequest. id 없는 질문·보기는 id 를 빼고 보낸다.
export function surveyToApi(questions, invite) {
  return {
    invite: { title: invite.title, body: invite.body },
    questions: questions.map((q) => ({
      ...(q.id ? { id: q.id } : {}),
      type: q.type.toUpperCase(),
      title: q.title,
      required: Boolean(q.required),
      archived: Boolean(q.archived),
      options: (q.options ?? []).map((o) => ({
        ...(o.id ? { id: o.id } : {}),
        label: o.label,
      })),
    })),
  }
}

export function responseFromApi(raw) {
  const plan = raw.plan ?? {}
  return {
    id: raw.id,
    memberId: raw.userId,
    nickname: raw.email ?? '',
    email: raw.email ?? '',
    submittedAt: raw.submittedAt,
    answers: { ...(raw.answers ?? {}) },
    plan: {
      ...plan,
      arrivalDate: plan.arrivalDate ?? plan.startDate,
      departureDate: plan.departureDate ?? plan.endDate,
      biasGroupIds: plan.biasGroupIds ?? [],
      keywordIds: plan.keywordIds ?? [],
    },
    gift: {
      status: (raw.gift?.status ?? 'PENDING').toLowerCase(),
      sentAt: raw.gift?.sentAt ?? null,
      adminName: null,
    },
  }
}

export function resultsFromApi(raw) {
  return {
    questions: (raw.questions ?? []).map(questionFromApi),
    responses: (raw.responses ?? []).map(responseFromApi),
    popup: { ...(raw.popup ?? {}) },
  }
}

const ERROR_CODES = {
  SURVEY_QUESTION_HAS_ANSWERS: 'QUESTION_HAS_ANSWERS',
  SURVEY_INVALID: 'INVALID_SURVEY',
}

// 백엔드 에러 코드 → 화면이 분기하는 코드. 나머지는 그대로.
export function surveyErrorCode(code) {
  return ERROR_CODES[code] ?? code
}
