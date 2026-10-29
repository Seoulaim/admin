import { groups } from './artists.js'

// Members (MA01, MA02, MA09, ML03 sign-up). The ones that appear in the
// example payments and inquiries come first, then made-up ones.
// - name: from sign-up; nickname: shown in the app (MA02).
// - language: the app language they use — mail goes out in it.
// - biasIds: their biases (member ids), in the order they added them.
// - consents: sign-up agreements — terms, privacy, age (required) and
//   marketing (optional), each { agreed, at }.
// - notifications: MA09 — service (account mail) and marketing on / off,
//   marketingUpdatedAt: when marketing last changed (consent date).
// - plan: { arrivalDate, departureDate, places } | null (one per member).
// - freeDiary: the first diary when it was never paid for (paid ones come
//   from the payments).
// - history: account events, oldest first.
const hoursAgo = (hours) => new Date(Date.now() - hours * 36e5).toISOString()
const allMembers = groups.flatMap((g) => g.members.map((m) => m.id))
const LANGUAGES = ['en', 'en', 'en', 'ko', 'zh', 'ja']

function makeMember(id, nickname, name, i, extra = {}) {
  const joinedHours = 24 * (3 + ((i * 7) % 60))
  const marketing = i % 5 !== 2
  // Agreed at sign-up; some turned it off later in MA09.
  const consentedMarketing = marketing || i % 2 === 0
  const marketingAt = hoursAgo(joinedHours - (marketing ? 0 : 24))
  const biasCount = 1 + (i % 5)
  const start = (i * 3) % allMembers.length
  return {
    id,
    nickname,
    name,
    email: `${nickname.toLowerCase().replace(/[^a-z0-9]/g, '') || `user${i}`}@example.com`,
    language: LANGUAGES[i % LANGUAGES.length],
    joinedAt: hoursAgo(joinedHours),
    lastSeenAt: hoursAgo((i * 5) % 72),
    biasIds: Array.from(
      { length: biasCount },
      (_, k) => allMembers[(start + k) % allMembers.length],
    ),
    consents: {
      terms: { agreed: true, at: hoursAgo(joinedHours) },
      privacy: { agreed: true, at: hoursAgo(joinedHours) },
      age: { agreed: true, at: hoursAgo(joinedHours) },
      marketing: { agreed: consentedMarketing, at: hoursAgo(joinedHours) },
    },
    notifications: {
      service: i % 7 !== 3,
      marketing,
      marketingUpdatedAt: marketingAt,
    },
    plan:
      i % 3 === 0
        ? null
        : {
            arrivalDate: '2026-11-0' + (1 + (i % 8)),
            departureDate: '2026-11-1' + (i % 8),
            places: 6 + (i % 7),
          },
    freeDiary:
      i % 4 === 1
        ? {
            id: `d-free-${i}`,
            name: 'My Seoul diary',
            first: true,
            pages: 2,
            finishedAt: null,
          }
        : null,
    history: [
      {
        at: hoursAgo(joinedHours),
        event: '가입',
        detail: '이메일 인증 후 가입',
      },
      ...(consentedMarketing && !marketing
        ? [
            {
              at: marketingAt,
              event: '마케팅 수신 해제',
              detail: 'MA09 설정에서 끔',
            },
          ]
        : []),
    ],
    ...extra,
  }
}

// Members named in the example payments and inquiries.
// [id, nickname, name, language] — language as in their inquiries.
const KNOWN = [
  ['u-040', 'Dami', '김다미', 'ko'],
  ['u-061', 'Rin', 'Rin Sato', 'en'],
  ['u-072', 'Nari', '박나리', 'ko'],
  ['u-090', 'Jin', 'Jin Park', 'en'],
  ['u-095', 'Yuna', '이유나', 'ko'],
  ['u-120', 'Hana', 'Hana Lee', 'en'],
  ['u-121', 'Sora', 'Sora Kim', 'en'],
  ['u-150', '小雨', '王小雨', 'zh'],
  ['u-176', 'Luna', 'Luna Garcia', 'en'],
  ['u-188', 'Yuki', '佐藤由紀', 'ja'],
  ['u-201', 'Mina', 'Mina Choi', 'en'],
  ['u-210', 'Haru', '정하루', 'ko'],
  ['u-215', 'Mei', '田中芽衣', 'ja'],
  ['u-230', 'Eun', '최은', 'ko'],
]
const OTHERS = [
  'Lily',
  'Kate',
  'Ami',
  'Xiao',
  'Ling',
  'Momo',
  'Sana',
  'Emma',
  'Chloe',
  'Noah',
  'Mia',
  'Zoe',
]

export const members = [
  ...KNOWN.map(([id, nickname, name, language], i) =>
    makeMember(id, nickname, name, i, { language }),
  ),
  ...Array.from({ length: 34 }, (_, k) => {
    const i = KNOWN.length + k
    const nickname = `${OTHERS[k % OTHERS.length]}${k >= OTHERS.length ? k : ''}`
    return makeMember(`u-${300 + k}`, nickname, nickname, i)
  }),
].map((member) => ({
  ...member,
  // The groups of their biases (mail audiences use this).
  biasGroupIds: [
    ...new Set(
      member.biasIds.map(
        (id) => groups.find((g) => g.members.some((m) => m.id === id))?.id,
      ),
    ),
  ],
  marketing: member.notifications.marketing,
}))

// Accounts the admin withdrew (강퇴), kept as a record without personal
// details beyond what the law asks to keep.
export const withdrawals = [
  {
    memberId: 'u-099',
    nickname: 'sp***',
    at: hoursAgo(24 * 15),
    adminName: '운영자',
    reason: 'abuse',
    memo: '다른 회원 사진을 반복해서 신고 문의로 올림',
  },
]

// Who opened a member's details, when (privacy log).
export const memberViews = []
