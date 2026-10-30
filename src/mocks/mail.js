import { addDays, todayKey } from '../lib/dates.js'

// Mail sent from 공지 관리, and the automatic mails' templates.
const hoursAgo = (hours) => new Date(Date.now() - hours * 36e5).toISOString()
// Tomorrow 10:00 in Seoul (marketing mail never goes out at night).
const tomorrowMorning = new Date(
  `${addDays(todayKey(), 1)}T10:00:00+09:00`,
).toISOString()

// Campaign: { id, kind: 'marketing' | 'notice', subject, body ({ en, ko, zh,
//   ja }), audience: { type: 'all' | 'groups' | 'members', groupIds,
//   memberIds }, status: 'draft' | 'scheduled' | 'sent' | 'canceled',
//   scheduledAt, sentAt, recipients, createdAt }
export const campaigns = [
  {
    id: 'mc-3',
    kind: 'marketing',
    subject: {
      en: 'Halloween stickers are here 🎃',
      ko: '할로윈 스티커가 나왔어요 🎃',
    },
    body: {
      en: 'Decorate your Seoul diary with new Halloween stickers!',
      ko: '새 할로윈 스티커로 서울 다이어리를 꾸며 보세요!',
    },
    audience: { type: 'all', groupIds: [], memberIds: [] },
    status: 'scheduled',
    scheduledAt: tomorrowMorning,
    sentAt: null,
    recipients: 32,
    createdAt: hoursAgo(5),
  },
  {
    id: 'mc-2',
    kind: 'notice',
    subject: { en: 'Updated privacy policy', ko: '개인정보처리방침 변경 안내' },
    body: {
      en: 'We updated our privacy policy. It takes effect on Nov 5.',
      ko: '개인정보처리방침이 바뀌었어요. 11월 5일부터 적용돼요.',
    },
    audience: { type: 'all', groupIds: [], memberIds: [] },
    status: 'sent',
    scheduledAt: null,
    sentAt: hoursAgo(24 * 3),
    recipients: 48,
    createdAt: hoursAgo(24 * 3),
  },
  {
    id: 'mc-1',
    kind: 'marketing',
    subject: { en: 'ATEEZ pop-up places in your plan' },
    body: { en: 'Add the ANITEEZ pop-up to your Seoul trip.' },
    audience: { type: 'groups', groupIds: ['ateez'], memberIds: [] },
    status: 'sent',
    scheduledAt: null,
    sentAt: hoursAgo(24 * 9),
    recipients: 5,
    createdAt: hoursAgo(24 * 9),
  },
  {
    id: 'mc-0',
    kind: 'marketing',
    subject: { en: 'Summer event ends soon' },
    body: { en: 'Last week of the summer event.' },
    audience: { type: 'all', groupIds: [], memberIds: [] },
    status: 'draft',
    scheduledAt: null,
    sentAt: null,
    recipients: 0,
    createdAt: hoursAgo(24 * 12),
  },
]

// Automatic mails the backend sends when something happens. They're
// transactional: sent whatever the member's mail settings (MA09), never
// with ads. variables: what {…} in the template is replaced with.
const auto = (id, name, trigger, variables, en, ko, sent) => ({
  id,
  name,
  trigger,
  variables,
  subject: { en: en[0], ko: ko[0] },
  body: { en: en[1], ko: ko[1] },
  sentLast30Days: sent,
})

export const autoMails = [
  auto(
    'signup-code',
    '회원가입 인증 코드',
    'ML03에서 인증 코드 요청',
    ['code'],
    ['Your Seoulaim code', 'Your code is {code}. It expires in 10 minutes.'],
    ['설레임 인증 코드', '인증 코드는 {code}예요. 10분 안에 입력해 주세요.'],
    214,
  ),
  auto(
    'reset-code',
    '비밀번호 재설정 코드',
    '비밀번호 재설정 요청',
    ['code'],
    ['Reset your password', 'Your code is {code}.'],
    ['비밀번호 재설정', '인증 코드는 {code}예요.'],
    23,
  ),
  auto(
    'payment-done',
    '결제 완료',
    '다이어리 결제가 승인됐을 때',
    ['nickname', 'diaryName', 'amount', 'orderId'],
    [
      'Payment complete',
      'Hi {nickname}, we received {amount} for "{diaryName}" (order {orderId}).',
    ],
    [
      '결제 완료',
      '{nickname}님, "{diaryName}" 결제 {amount}이 완료됐어요 (주문 {orderId}).',
    ],
    74,
  ),
  auto(
    'refund-done',
    '환불 완료',
    '환불 관리에서 환불했을 때',
    ['nickname', 'amount', 'diaryName'],
    [
      'Your refund is done',
      'Hi {nickname}, we refunded {amount} for "{diaryName}".',
    ],
    ['환불 완료', '{nickname}님, "{diaryName}" {amount}을 환불했어요.'],
    6,
  ),
  auto(
    'refund-rejected',
    '환불 거절',
    '환불 관리에서 거절했을 때',
    ['nickname', 'reason'],
    [
      'About your refund request',
      'Hi {nickname}, we could not refund this payment: {reason}',
    ],
    ['환불 요청 결과', '{nickname}님, 이번 결제는 환불되지 않아요: {reason}'],
    2,
  ),
  auto(
    'inquiry-answer',
    '문의 답변',
    '문의 관리에서 답변을 보냈을 때',
    ['nickname', 'title', 'answer'],
    ['Re: {title}', 'Hi {nickname},\n\n{answer}'],
    ['Re: {title}', '{nickname}님,\n\n{answer}'],
    41,
  ),
  auto(
    'diary-expiring',
    '다이어리 삭제 예정',
    '보관 기간 만료 7일 전 (편집 중 90일, 완성 1년)',
    ['nickname', 'diaryName', 'deleteDate'],
    [
      'Your diary will be deleted soon',
      'Hi {nickname}, "{diaryName}" will be deleted on {deleteDate}. Download it before then.',
    ],
    [
      '다이어리 삭제 예정 안내',
      '{nickname}님, "{diaryName}"이 {deleteDate}에 삭제돼요. 그 전에 내려받아 주세요.',
    ],
    9,
  ),
  auto(
    'withdrawn',
    '탈퇴 완료',
    '회원 탈퇴(MA02)',
    ['nickname'],
    [
      'Your account is deleted',
      'Goodbye {nickname}. Your account and data are deleted.',
    ],
    ['탈퇴 완료', '{nickname}님의 계정과 데이터가 삭제됐어요.'],
    2,
  ),
  auto(
    'member-removed',
    '강퇴 안내',
    '회원 관리에서 강퇴했을 때',
    ['nickname', 'reason'],
    [
      'Your Seoulaim account was closed',
      'Hi {nickname}, we closed your account for this reason: {reason}\n\nYour account and data are deleted. If you disagree, contact us through General Inquiries at the bottom of the site (no login needed) or at seoulaimkr@gmail.com.',
    ],
    [
      '설레임 계정 해지 안내',
      '{nickname}님, 다음 사유로 회원 자격이 해지됐어요: {reason}\n\n계정과 데이터는 삭제됐어요. 이의가 있으면 사이트 하단 일반 문의(로그인 불필요) 또는 seoulaimkr@gmail.com으로 알려 주세요.',
    ],
    1,
  ),
  auto(
    'marketing-recheck',
    '광고 수신 동의 확인',
    '마케팅 수신 동의 후 2년마다 (정보통신망법)',
    ['nickname', 'consentDate'],
    [
      'Do you still want our news?',
      'Hi {nickname}, you agreed to receive news on {consentDate}. You can change this anytime in Settings.',
    ],
    [
      '광고성 정보 수신 동의 확인',
      '{nickname}님은 {consentDate}에 광고성 정보 수신에 동의했어요. 설정에서 언제든 바꿀 수 있어요.',
    ],
    0,
  ),
]
