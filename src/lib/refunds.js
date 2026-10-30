import { addDays, daysBetween, fromDateKey, seoulDateKey } from './dates.js'

// Refund policy (member app refund.ko.md).
export const REFUND_DAYS = 7 // 제3조 1항: within 7 days of paying, no edits
export const PROCESSING_BUSINESS_DAYS = 3 // 제6조: handled within 3 business days

// 제5조: refunds outside the policy, plus the admin's own call — which is
// also 제3조 2항, the company deciding on an edited diary ('other'). A refund
// outside the policy needs one of these (and a memo for 'other').
export const EXCEPTION_REASONS = [
  { id: 'duplicate', label: '중복 결제', article: '제5조 1호' },
  {
    id: 'not-provided',
    label: '결제했지만 유료 기능이 제공되지 않음',
    article: '제5조 2호',
  },
  {
    id: 'company-error',
    label: '회사 오류로 완성본을 열람·다운로드할 수 없음',
    article: '제5조 3호',
  },
  {
    id: 'misrepresented',
    label: '광고·안내·계약 내용과 다른 제공',
    article: '제5조 4호',
  },
  { id: 'other', label: '기타 (운영 판단)', article: null },
]

export const exceptionLabel = (id) =>
  EXCEPTION_REASONS.find((r) => r.id === id)?.label ?? id

// Whether the request fits the policy, judged when it was asked (a slow
// answer never costs the member their refund): within 7 days of paying and
// not edited since (제3조 1항; on a first diary only pages 3+ count), not finished
// (제4조). { daysSincePayment, inTime, notEdited, notFinished, ok }
export function checkRefundPolicy(payment, requestedAt) {
  const daysSincePayment = daysBetween(
    seoulDateKey(payment.paidAt),
    seoulDateKey(requestedAt),
  )
  const inTime = daysSincePayment <= REFUND_DAYS
  const completedAt = payment.diary.completedAt
  const notFinished = !completedAt || completedAt > requestedAt
  const { editedAt } = payment
  const notEdited = !editedAt || editedAt > requestedAt
  return {
    daysSincePayment,
    inTime,
    notEdited,
    notFinished,
    ok: inTime && notFinished && notEdited,
  }
}

// The last day to handle it: 3 business days after the request (weekends
// skipped; public holidays aren't known here).
export function processingDeadline(requestedAt) {
  let key = seoulDateKey(requestedAt)
  let left = PROCESSING_BUSINESS_DAYS
  while (left > 0) {
    key = addDays(key, 1)
    const weekday = fromDateKey(key).getDay()
    if (weekday !== 0 && weekday !== 6) left--
  }
  return key
}

export const REFUND_STATUS = {
  requested: { label: '처리 대기', tone: 'bg-warn-soft text-warn' },
  refunded: { label: '환불 완료', tone: 'bg-ok-soft text-ok' },
  rejected: { label: '거절', tone: 'bg-chip text-muted' },
}

// What refunding does to the diary (환불 정책 제3조 3·4항).
export function diaryOutcome(diary) {
  return diary.first
    ? '첫 다이어리라서 결제만 취소되고, 3쪽부터 잠겨요(꾸민 내용은 남아요).'
    : '다이어리와 등록 사진이 삭제돼요.'
}
