import { addDays, todayKey } from '../lib/dates.js'

// Example data for the admin screens. Shapes follow the member app
// (Seoulaim_web src/api, src/mocks) so the backend serves both the same way.

const today = todayKey()
const hoursAgo = (hours) =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

export const admin = {
  name: '운영자',
  email: 'admin@seoulaim.com',
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

// Help Center inquiries (member app me.submitInquiry). status: 'received'
// until the admin replies by email ('answered'). A refund inquiry names the
// payment; refundStatus tracks it: 'requested' → 'refunded' | 'rejected'.
export const inquiries = [
  {
    id: 'iq-1031',
    author: { id: 'u-201', nickname: 'Mina', email: 'mina@example.com' },
    category: 'refund',
    paymentId: 'pay-5012',
    title: 'Wrong diary paid',
    content: 'I paid for the wrong diary. Can I get a refund?',
    photoUrls: [],
    createdAt: hoursAgo(2),
    status: 'received',
  },
  {
    id: 'iq-1030',
    author: { id: 'u-188', nickname: 'Yuki', email: 'yuki@example.com' },
    category: 'diary',
    paymentId: null,
    title: 'PDF download stops at 80%',
    content: 'The download stops when I press Done.',
    photoUrls: [],
    createdAt: hoursAgo(5),
    status: 'received',
  },
  {
    id: 'iq-1029',
    author: { id: 'u-176', nickname: 'Luna', email: 'luna@example.com' },
    category: 'refund',
    paymentId: 'pay-4987',
    title: 'Refund please',
    content: 'I bought a second diary by mistake.',
    photoUrls: [],
    createdAt: hoursAgo(26),
    status: 'received',
  },
  {
    id: 'iq-1028',
    author: { id: 'u-150', nickname: '小雨', email: 'xiaoyu@example.com' },
    category: 'account',
    paymentId: null,
    title: 'Cannot change my nickname',
    content: 'The save button does nothing.',
    photoUrls: [],
    createdAt: hoursAgo(30),
    status: 'received',
  },
  {
    id: 'iq-1027',
    author: { id: 'u-121', nickname: 'Sora', email: 'sora@example.com' },
    category: 'payment',
    paymentId: null,
    title: 'Charged twice?',
    content: 'I see two charges on my card.',
    photoUrls: [],
    createdAt: hoursAgo(52),
    status: 'answered',
  },
]

// Diary payments (member app payments.getMyPayments, plus who paid).
// provider: 'toss' now; app store payments may come with the app version.
export const payments = [
  {
    id: 'pay-5012',
    orderId: 'ord-20261029-0012',
    member: { id: 'u-201', nickname: 'Mina' },
    diary: { id: 'd-881', name: 'Seoul in autumn', finishedAt: null },
    amount: 3000,
    provider: 'toss',
    paidAt: `${addDays(today, -1)}T14:20:00+09:00`,
    refundStatus: 'requested',
  },
  {
    id: 'pay-4987',
    orderId: 'ord-20261023-0031',
    member: { id: 'u-176', nickname: 'Luna' },
    diary: { id: 'd-842', name: 'ATEEZ concert day', finishedAt: null },
    amount: 2000,
    provider: 'toss',
    paidAt: `${addDays(today, -5)}T20:05:00+09:00`,
    refundStatus: 'requested',
  },
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
