import { members } from './members.js'
import { keywords } from './places.js'

// The plan satisfaction survey (popup on the TRAVEL tab) and its answers.
// Question: { id, type, title, required, options: [{ id, label }],
//   archived } — title / label { en, ko, zh, ja }. Ids never change, so
// answers stay matched after edits; a question with answers is archived
// (hidden from the popup) instead of deleted.
const text = (en, ko) => ({ en, ko })
const option = (id, en, ko) => ({ id, label: text(en, ko) })

// invite: the popup on the TRAVEL tab that asks members to take part (예
// opens the survey screen). Its text names the reward, so it's editable.
// enabled: whether the member app shows the invite popup at all.
export const survey = {
  enabled: true,
  updatedAt: new Date(Date.now() - 20 * 864e5).toISOString(),
  invite: {
    title: {
      en: 'How was your plan?',
      ko: '플랜은 어떠셨나요?',
    },
    body: {
      en: 'Answer a short survey and we will send an Americano gift card to your account email.',
      ko: '설문에 참여하시면 연동된 이메일로 아메리카노 기프티콘을 보내드립니다.',
    },
  },
  questions: [
    {
      id: 'q-rating',
      type: 'rating',
      title: text(
        'How happy are you with your plan?',
        '플랜이 얼마나 마음에 드세요?',
      ),
      required: true,
      options: [],
      archived: false,
    },
    {
      id: 'q-best',
      type: 'single',
      title: text('What did you like most?', '가장 좋았던 점은 뭐예요?'),
      required: false,
      options: [
        option('o-places', 'The places', '추천 장소'),
        option('o-bias', 'Places tied to my bias', '최애 관련 장소'),
        option('o-route', 'The route', '동선'),
        option('o-map', 'The map', '지도'),
      ],
      archived: false,
    },
    {
      id: 'q-better',
      type: 'multiple',
      title: text('What could be better?', '아쉬운 점을 골라 주세요'),
      required: false,
      options: [
        option('o-more', 'More places', '장소가 더 많았으면'),
        option('o-far', 'Places too far apart', '장소끼리 너무 멀어요'),
        option('o-hours', 'Opening hours', '영업시간 정보'),
        option('o-lang', 'Translations', '번역'),
      ],
      archived: false,
    },
    {
      id: 'q-words',
      type: 'text',
      title: text('Anything else to tell us?', '하고 싶은 말이 있나요?'),
      required: false,
      options: [],
      archived: false,
    },
  ],
}

const WORDS = [
  'Loved the cafe NI-KI went to!',
  '동선이 조금 멀었어요',
  'More pop-up stores please',
  '最喜欢的地方很多，谢谢',
  '',
  'Great plan, but some hours were wrong',
  '',
  '최애 장소가 많아서 좋았어요',
]
const planMembers = members.filter((m) => m.plan)

// Made-up answers over the last 30 days from members who have a plan.
// plan: what the plan was when they answered (to compare by bias /
// keyword). Its biasGroupIds come from the biases saved in the plan, which
// can differ from the member's current ones. email: where the gift card goes (the account email).
// gift: { status: 'pending' | 'sent', sentAt, adminName } — the reward.
export const responses = planMembers.slice(0, 24).map((m, i) => ({
  id: `sr-${i}`,
  memberId: m.id,
  nickname: m.nickname,
  email: m.email,
  gift:
    i >= 6
      ? {
          status: 'sent',
          sentAt: new Date(
            Date.now() - ((i * 29) % 30) * 864e5 + 864e5,
          ).toISOString(),
          adminName: '운영자',
        }
      : { status: 'pending', sentAt: null, adminName: null },
  submittedAt: new Date(
    Date.now() - ((i * 29) % 30) * 864e5 - i * 36e5,
  ).toISOString(),
  plan: {
    ...m.plan,
    biasGroupIds: m.biasGroupIds,
    keywordIds: [
      keywords[i % keywords.length].id,
      keywords[(i + 5) % keywords.length].id,
    ],
  },
  answers: {
    'q-rating': [5, 4, 5, 3, 4, 5, 2, 4][i % 8],
    'q-best': ['o-places', 'o-bias', 'o-bias', 'o-route', 'o-map'][i % 5],
    'q-better': [
      ['o-far'],
      ['o-more', 'o-hours'],
      [],
      ['o-lang'],
      ['o-far', 'o-more'],
    ][i % 5],
    'q-words': WORDS[i % WORDS.length],
  },
}))

// Popup counters from the backend: shown, closed (X), snoozed (오늘 하루
// 보지 않기), by day — for the response rate.
export const popupStats = {
  planCreators: planMembers.length,
  shown: responses.length * 3 + 11,
  closed: responses.length + 9,
  snoozed: 14,
}
