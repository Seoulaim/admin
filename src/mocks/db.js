import { addDays, todayKey } from '../lib/dates.js'

// Example data for the admin screens. Shapes follow the member app
// (Seoulaim_web src/api, src/mocks) so the backend serves both the same way.

const today = todayKey()
const hoursAgo = (hours) =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

export const admin = {
  name: '운영자',
  email: 'seoulaimkr@gmail.com',
}

// Last 14 days, oldest first: new members and paid diaries per day.
const SIGNUPS = [8, 12, 9, 15, 11, 7, 10, 18, 22, 14, 16, 19, 13, 24]
const PAYMENTS = [2, 3, 1, 4, 3, 2, 2, 5, 6, 3, 4, 5, 3, 6]
export const dailyStats = SIGNUPS.map((signups, i) => ({
  date: addDays(today, i - (SIGNUPS.length - 1)),
  signups,
  payments: PAYMENTS[i],
}))

export const monthStats = {
  thisMonth: { paymentCount: 74, revenue: 214000 },
  lastMonth: { paymentCount: 61, revenue: 178000 },
}

// Help Center inquiries (member app me.submitInquiry), newest last.
// language: the app language the member wrote in (reply in it).
// status: 'received' until the admin answers by email ('answered').
// answers: [{ id, body, sentAt, adminName }] — each one was emailed.
// memo: admin-only note.
// A refund inquiry names the payment (paymentId) and carries refund:
//   { status: 'requested' | 'refunded' | 'rejected', decidedAt, adminName,
//     exception: { reason, memo } | null, rejectReason }
// and refundWithinPolicy: the server's call on 환불 정책 제3조 1항 / 제4조.
// A member can still ask within 7 days after editing; it arrives marked
// false.
const at = (hours) => hoursAgo(hours)
const asked = (id, nickname, email) => ({ id, nickname, email })
const requested = {
  status: 'requested',
  decidedAt: null,
  adminName: null,
  exception: null,
  rejectReason: '',
}

export const inquiries = [
  {
    id: 'iq-1020',
    author: asked('u-090', 'Jin', 'jin@example.com'),
    language: 'en',
    category: 'refund',
    paymentId: 'pay-4800',
    title: 'Refund for my second diary',
    content: 'I made a second diary by mistake. Please refund it.',
    photoUrls: [],
    createdAt: at(24 * 7),
    status: 'answered',
    answers: [],
    memo: '',
    refundWithinPolicy: true,
    refund: {
      status: 'refunded',
      decidedAt: at(24 * 6),
      adminName: '운영자',
      exception: null,
      rejectReason: '',
    },
  },
  {
    id: 'iq-1021',
    author: asked('u-095', 'Yuna', 'yuna@example.com'),
    language: 'ko',
    category: 'refund',
    paymentId: 'pay-4810',
    title: '환불해 주세요',
    content: '다이어리를 다 만들었는데 마음에 안 들어요.',
    photoUrls: [],
    createdAt: at(24 * 5),
    status: 'answered',
    answers: [],
    memo: '',
    refundWithinPolicy: false,
    refund: {
      status: 'rejected',
      decidedAt: at(24 * 4),
      adminName: '운영자',
      exception: null,
      rejectReason:
        '완성(Done)한 다이어리는 환불 정책 제4조에 따라 환불되지 않아요.',
    },
  },
  {
    id: 'iq-1024',
    author: asked('u-120', 'Hana', 'hana@example.com'),
    language: 'en',
    category: 'other',
    paymentId: null,
    title: 'Can I print my diary?',
    content: 'Is there a way to order a printed copy?',
    photoUrls: [],
    createdAt: at(24 * 4),
    status: 'answered',
    answers: [
      {
        id: 'an-1',
        body: 'Hi Hana, we only offer PDF / JPG downloads for now, which you can print at any print shop. Thank you!',
        sentAt: at(24 * 3),
        adminName: '운영자',
      },
    ],
    memo: '',
  },
  {
    id: 'iq-1027',
    author: asked('u-121', 'Sora', 'sora@example.com'),
    language: 'en',
    category: 'payment',
    paymentId: null,
    title: 'Charged twice?',
    content: 'I see two charges on my card for the same diary.',
    photoUrls: [],
    createdAt: at(52),
    status: 'answered',
    answers: [
      {
        id: 'an-2',
        body: 'Hi Sora, sorry about that. Please send a refund request for the second payment from the Help Center and we will cancel it.',
        sentAt: at(40),
        adminName: '운영자',
      },
    ],
    memo: '토스에서 중복 결제 확인함',
  },
  {
    id: 'iq-1028',
    author: asked('u-150', '小雨', 'xiaoyu@example.com'),
    language: 'zh',
    category: 'account',
    paymentId: null,
    title: 'Cannot change my nickname',
    content: 'The save button does nothing when I change my nickname.',
    photoUrls: [],
    createdAt: at(30),
    status: 'received',
    answers: [],
    memo: '',
  },
  {
    id: 'iq-1029',
    author: asked('u-176', 'Luna', 'luna@example.com'),
    language: 'en',
    category: 'refund',
    paymentId: 'pay-4987',
    title: 'Refund please',
    content: 'I bought the rest of my first diary but I will not use it.',
    photoUrls: [],
    createdAt: at(26),
    status: 'received',
    answers: [],
    memo: '',
    refundWithinPolicy: false,
    refund: { ...requested },
  },
  {
    id: 'iq-1030',
    author: asked('u-121', 'Sora', 'sora@example.com'),
    language: 'en',
    category: 'refund',
    paymentId: 'pay-4950',
    title: 'Duplicate payment',
    content: 'As your team said, this is the second charge for the same diary.',
    photoUrls: [],
    createdAt: at(20),
    status: 'received',
    answers: [],
    memo: '',
    refundWithinPolicy: false,
    refund: { ...requested },
  },
  {
    id: 'iq-1031',
    author: asked('u-188', 'Yuki', 'yuki@example.com'),
    language: 'ja',
    category: 'diary',
    paymentId: null,
    title: 'PDF download stops at 80%',
    content: 'When I press Done the download stops at 80% on my iPhone.',
    photoUrls: ['/mock/goods-photocards.jpg'],
    createdAt: at(5),
    status: 'received',
    answers: [],
    memo: '',
  },
  {
    id: 'iq-1032',
    author: asked('u-210', 'Haru', 'haru@example.com'),
    language: 'ko',
    category: 'refund',
    paymentId: 'pay-5001',
    title: '실수로 완성을 눌렀어요',
    content: '아직 덜 꾸몄는데 Done을 눌러버렸어요. 환불 가능할까요?',
    photoUrls: [],
    createdAt: at(10),
    status: 'received',
    answers: [],
    memo: '',
    refundWithinPolicy: false,
    refund: { ...requested },
  },
  {
    id: 'iq-1033',
    author: asked('u-215', 'Mei', 'mei@example.com'),
    language: 'ja',
    category: 'report',
    paymentId: null,
    title: 'Wrong place information',
    content: 'The opening hours of HYBE Insight are wrong.',
    photoUrls: [],
    createdAt: at(3),
    status: 'received',
    answers: [],
    memo: '',
  },
  {
    id: 'iq-1034',
    author: asked('u-201', 'Mina', 'mina@example.com'),
    language: 'en',
    category: 'refund',
    paymentId: 'pay-5012',
    title: 'Wrong diary paid',
    content: 'I paid for the wrong diary. Can I get a refund?',
    photoUrls: [],
    createdAt: at(2),
    status: 'received',
    answers: [],
    memo: '',
    refundWithinPolicy: true,
    refund: { ...requested },
  },
  // Yuki's first diary: refunded by exception, then paid again. Each
  // request judges its own payment.
  {
    id: 'iq-1018',
    author: asked('u-188', 'Yuki', 'yuki@example.com'),
    language: 'ja',
    category: 'refund',
    paymentId: 'pay-4780',
    title: 'Refund for my diary',
    content: 'I will not travel this year.',
    photoUrls: [],
    createdAt: at(24 * 11),
    status: 'answered',
    answers: [],
    memo: '',
    refundWithinPolicy: false,
    refund: {
      status: 'refunded',
      decidedAt: at(24 * 10),
      adminName: '운영자',
      exception: { reason: 'other', memo: '여행 취소, 운영 판단으로 환불' },
      rejectReason: '',
    },
  },
  {
    id: 'iq-1035',
    author: asked('u-188', 'Yuki', 'yuki@example.com'),
    language: 'ja',
    category: 'refund',
    paymentId: 'pay-5015',
    title: 'Paid again by mistake',
    content: 'I paid again but changed my mind. I did not edit anything.',
    photoUrls: [],
    createdAt: at(4),
    status: 'received',
    answers: [],
    memo: '',
    refundWithinPolicy: true,
    refund: { ...requested },
  },
  // Asked while the old app's editedAt stood; the one-time clean-up cleared
  // it but left the stored verdict.
  {
    id: 'iq-1036',
    author: asked('u-215', 'Mei', 'mei@example.com'),
    language: 'ja',
    category: 'refund',
    paymentId: 'pay-5018',
    title: 'Refund please',
    content: 'I only changed the first page. Can I get a refund?',
    photoUrls: [],
    createdAt: at(8),
    status: 'received',
    answers: [],
    memo: '',
    refundWithinPolicy: false,
    refund: { ...requested },
  },
]

// Diary payments (member app payments.getMyPayments, plus who paid).
// provider: 'toss' now; app store payments may come with the app version.
// diary.first: the account's free diary (refunding it locks pages 3+;
// any other diary is deleted). diary.completedAt: when Done was pressed.
// editedAt: the first edit after paying, or null. On a first diary only
// pages 3+ count: pages 1–2 are free to change, before or after paying.
const member = (id, nickname) => ({
  id,
  nickname,
  email: `${nickname.toLowerCase()}@example.com`,
})
const diary = (
  id,
  name,
  pages,
  { first = false, completedHours = null } = {},
) => ({
  id,
  name,
  first,
  pages,
  completedAt: completedHours == null ? null : hoursAgo(completedHours),
})
const payment = (id, buyer, paidDiary, amount, hours, editedHours = null) => ({
  id,
  orderId: `ord-${id.slice(4)}`,
  member: buyer,
  diary: paidDiary,
  amount,
  provider: 'toss',
  paidAt: hoursAgo(hours),
  refundConsentAt: hoursAgo(hours),
  editedAt: editedHours == null ? null : hoursAgo(editedHours),
})

const paidAgain = diary('d-850', 'Back to Seoul', 4, { first: true })

export const payments = [
  payment(
    'pay-4780',
    member('u-188', 'Yuki'),
    paidAgain,
    3000,
    24 * 12,
    24 * 11.5,
  ),
  payment('pay-5015', member('u-188', 'Yuki'), paidAgain, 3000, 24 * 2),
  payment(
    'pay-5018',
    member('u-215', 'Mei'),
    diary('d-875', 'Hanok stay', 2, { first: true }),
    3000,
    24 * 3,
  ),
  payment(
    'pay-4500',
    member('u-040', 'Dami'),
    diary('d-600', 'Hongdae day', 6, { completedHours: 24 * 18 }),
    3000,
    24 * 20,
    24 * 19,
  ),
  payment(
    'pay-4620',
    member('u-061', 'Rin'),
    diary('d-640', 'BTS tour', 8, { first: true, completedHours: 24 * 12 }),
    2000,
    24 * 14,
    24 * 13,
  ),
  payment(
    'pay-4700',
    member('u-072', 'Nari'),
    diary('d-660', 'Myeongdong', 3, { completedHours: 40 }),
    3000,
    24 * 4,
    24 * 3,
  ),
  payment(
    'pay-4800',
    member('u-090', 'Jin'),
    diary('d-700', null, 0),
    3000,
    24 * 8,
  ),
  payment(
    'pay-4810',
    member('u-095', 'Yuna'),
    diary('d-710', '부산 여행', 6, { completedHours: 24 * 6 }),
    3000,
    24 * 7,
    24 * 6.5,
  ),
  payment(
    'pay-4950',
    member('u-121', 'Sora'),
    diary('d-801', 'SVT concert', 4),
    3000,
    24 * 10,
    24 * 9,
  ),
  payment(
    'pay-4951',
    member('u-121', 'Sora'),
    diary('d-801', 'SVT concert', 4),
    3000,
    24 * 10 - 0.1,
    24 * 9,
  ),
  payment(
    'pay-4987',
    member('u-176', 'Luna'),
    diary('d-842', 'ATEEZ concert day', 5, { first: true }),
    2000,
    24 * 5,
    24 * 3,
  ),
  payment(
    'pay-5001',
    member('u-210', 'Haru'),
    diary('d-860', '성수 투어', 3, { completedHours: 30 }),
    3000,
    24 * 3,
    48,
  ),
  payment(
    'pay-5012',
    member('u-201', 'Mina'),
    diary('d-881', 'Seoul in autumn', 2),
    3000,
    30,
  ),
  payment(
    'pay-5020',
    member('u-230', 'Eun'),
    diary('d-890', 'First trip', 2, { first: true }),
    3000,
    12,
  ),
]

// HH01 main banners (placement HOME) and DD01 banners (placement DIARY),
// in the admin order — the order within each placement is what the member
// app shows. Each placement has one default banner: always posted, can't be
// turned off or deleted, only edited.
const daysAgo = (days) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

export const promotions = [
  {
    id: 'pr-home-default',
    placement: 'HOME',
    adminTitle: '홈 기본 배너',
    imageUrl: '/mock/banner-dejavu.jpg',
    title: { en: 'Your K-pop trip to Seoul', ko: '최애와 함께하는 서울 여행' },
    description: { en: 'Plan the places your bias visited' },
    ctaLabel: {},
    targetType: 'DIARY',
    targetUrl: '',
    startDate: null,
    endDate: null,
    enabled: true,
    isDefault: true,
    createdAt: daysAgo(40),
  },
  {
    id: 'pr-1',
    placement: 'HOME',
    adminTitle: 'ATEEZ 팝업 데자뷰',
    imageUrl: '/mock/event-billboard.jpg',
    title: { en: 'ANITEEZ IN DEJAVU' },
    description: { en: 'ATEEZ pop-up store in Seoul' },
    ctaLabel: {},
    targetType: 'URL',
    targetUrl: 'https://example.com/aniteez-in-dejavu',
    startDate: addDays(today, -5),
    endDate: addDays(today, 4),
    enabled: true,
    isDefault: false,
    createdAt: daysAgo(6),
  },
  {
    id: 'pr-2',
    placement: 'HOME',
    adminTitle: '생일카페 주간',
    imageUrl: '/mock/event-birthday.jpg',
    title: { en: 'Birthday cafe week', ko: '생일카페 주간' },
    description: { en: 'Cup sleeves and photocards in Hongdae' },
    ctaLabel: {},
    targetType: 'URL',
    targetUrl: 'https://example.com/birthday-cafe-week',
    startDate: addDays(today, 3),
    endDate: addDays(today, 10),
    enabled: true,
    isDefault: false,
    createdAt: daysAgo(1),
  },
  {
    id: 'pr-3',
    placement: 'HOME',
    adminTitle: '추석 이벤트',
    imageUrl: '/mock/goods-photocards.jpg',
    title: { en: 'Chuseok in Seoul' },
    description: {},
    ctaLabel: {},
    targetType: 'URL',
    targetUrl: 'https://example.com/chuseok',
    startDate: addDays(today, -30),
    endDate: addDays(today, -20),
    enabled: true,
    isDefault: false,
    createdAt: daysAgo(32),
  },
  {
    id: 'pr-diary-default',
    placement: 'DIARY',
    adminTitle: '다이어리 기본 배너',
    imageUrl: '/mock/banner-diary-passport.png',
    title: {
      en: 'Make every trip\nmore special',
      ko: '여행의 순간을,\n더 특별하게',
      zh: '让每一次旅行\n更加特别',
      ja: 'すべての旅を\nもっと特別に',
    },
    description: {
      en: 'Record your travels and everyday\nmoments with Seoulaim.',
      zh: '和Seoulaim一起\n记录旅行与日常。',
    },
    ctaLabel: { en: 'Discover now', zh: '立即探索' },
    targetType: 'DIARY',
    targetUrl: '',
    startDate: null,
    endDate: null,
    enabled: true,
    isDefault: true,
    createdAt: daysAgo(40),
  },
  {
    id: 'pr-4',
    placement: 'DIARY',
    adminTitle: '최애로 채우는 다이어리',
    imageUrl: '/mock/goods-photocards.jpg',
    title: {
      en: 'Fill your pages\nwith your bias',
      zh: '用你的本命\n填满每一页',
    },
    description: { en: 'Photocards, stickers and memos\nall in one diary.' },
    ctaLabel: { en: 'Discover now' },
    targetType: 'DIARY',
    targetUrl: '',
    startDate: addDays(today, -2),
    endDate: addDays(today, 12),
    enabled: false,
    isDefault: false,
    createdAt: daysAgo(3),
  },
]

// HH01 fan calendar and "Event coming up", registered together.
// Fan calendar: entries with inCalendar, on startDate, as title in color.
// Event coming up: entries with an image (imageUrl) — they also carry
// endDate, venue and targetUrl. Added from the calendar with a photo: both;
// without one: the calendar only. Added from the Event coming up tab: that
// card only (inCalendar false).
// groupIds: ['all'] for everyone, otherwise the groups it's about.
const scheduleOnly = { endDate: null, imageUrl: '', venue: {}, targetUrl: '' }

export const calendarEntries = [
  {
    id: 'ce-1',
    groupIds: ['ateez'],
    title: { en: 'ATEEZ 2026 WORLD TOUR', ko: '에이티즈 2026 월드투어' },
    startDate: addDays(today, 2),
    endDate: addDays(today, 4),
    inCalendar: true,
    color: 'purple',
    imageUrl: '/mock/event-billboard.jpg',
    venue: { en: 'KSPO DOME', ko: 'KSPO 돔' },
    targetUrl: 'https://example.com/ateez-tour',
    createdAt: daysAgo(10),
  },
  {
    id: 'ce-2',
    groupIds: ['ateez'],
    title: { en: 'ANITEEZ IN DEJAVU' },
    startDate: addDays(today, -5),
    endDate: addDays(today, 4),
    inCalendar: true,
    color: 'orange',
    imageUrl: '/mock/banner-dejavu.jpg',
    venue: { en: 'SEONGSU' },
    targetUrl: 'https://example.com/aniteez-in-dejavu',
    createdAt: daysAgo(12),
  },
  {
    id: 'ce-3',
    groupIds: ['all'],
    title: { en: 'K-POP SUPER FESTIVAL' },
    startDate: addDays(today, 9),
    endDate: addDays(today, 10),
    inCalendar: false,
    color: null,
    imageUrl: '/mock/event-birthday.jpg',
    venue: { en: 'Olympic Park' },
    targetUrl: 'https://example.com/festival',
    createdAt: daysAgo(4),
  },
  {
    id: 'ce-4',
    groupIds: ['ateez'],
    title: { en: 'Comeback', ko: '컴백' },
    startDate: addDays(today, 6),
    inCalendar: true,
    color: 'pink',
    ...scheduleOnly,
    createdAt: daysAgo(8),
  },
  {
    id: 'ce-5',
    groupIds: ['straykids'],
    title: { en: "Felix's birthday", ko: '필릭스 생일' },
    startDate: addDays(today, -14),
    inCalendar: true,
    color: 'green',
    ...scheduleOnly,
    createdAt: daysAgo(20),
  },
  {
    id: 'ce-6',
    groupIds: ['straykids'],
    title: { en: 'Music Bank' },
    startDate: addDays(today, 1),
    inCalendar: true,
    color: 'blue',
    ...scheduleOnly,
    createdAt: daysAgo(3),
  },
  {
    id: 'ce-7',
    groupIds: ['svt', 'txt'],
    title: { en: 'Fan meeting' },
    startDate: addDays(today, 6),
    inCalendar: true,
    color: 'gray',
    ...scheduleOnly,
    createdAt: daysAgo(2),
  },
  {
    id: 'ce-8',
    groupIds: ['all'],
    title: { en: 'Seoul Music Awards' },
    startDate: today,
    inCalendar: true,
    color: 'purple',
    ...scheduleOnly,
    createdAt: daysAgo(15),
  },
]

// HH01 "Birthday cafe": fan-run cafes for a member's birthday.
// memberId: whose birthday; the member's group decides who sees it.
export const birthdayCafes = [
  {
    id: 'bc-1',
    memberId: 'san',
    venue: { en: 'Cafe Lettering Seoul', ko: '카페 레터링 서울' },
    startDate: addDays(today, 1),
    endDate: addDays(today, 3),
    imageUrl: '/mock/event-birthday.jpg',
    linkUrl: 'https://example.com/birthday-cafe-1',
    createdAt: daysAgo(5),
  },
  {
    id: 'bc-2',
    memberId: 'felix',
    venue: { en: 'Moment Cafe', ko: '모먼트 카페' },
    startDate: addDays(today, -16),
    endDate: addDays(today, -13),
    imageUrl: '/mock/event-billboard.jpg',
    linkUrl: 'https://example.com/birthday-cafe-2',
    createdAt: daysAgo(25),
  },
  {
    id: 'bc-3',
    memberId: 'yunho',
    venue: { en: 'Cafe Dejavu', ko: '카페 데자뷰' },
    startDate: addDays(today, -1),
    endDate: addDays(today, 2),
    imageUrl: '/mock/banner-dejavu.jpg',
    linkUrl: 'https://example.com/birthday-cafe-3',
    createdAt: daysAgo(6),
  },
]
