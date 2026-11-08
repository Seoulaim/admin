// 백엔드 어드민 결제 DTO (AdminPaymentResponse·AdminPaymentDetailResponse,
// docs/admin-ops.md 1절) → 화면 형태 (api/payments.js 참고). 필드명은
// 백엔드가 어드민 mock 을 따랐으므로 얇다.
//
// - status: 백엔드 pending | paid | failed | refunded + refundRequested.
//   mock 의 'refund-requested' 는 paid 이면서 refundRequested 인 결제로
//   만든다 (필터는 백엔드 status 기준이라 '환불 요청' 탭은 없음).
// - member.email: 탈퇴 회원은 null → 대체 문구.
// - diary: 못 찾으면 null → 삭제된 다이어리 (name null, deleted true).
// - paidAt: 결제 전(pending·failed)이면 null — 화면은 createdAt 으로 대신.
// - #59: method CARD | PAYPAL (enum, 대문자), methodDetail 토스 결제수단 문자열,
//   currency KRW | USD, amount 는 통화 단위 (USD 2.99). methodLabel 은 화면용
//   ('카드' / 'PayPal (해외간편결제(PAYPAL))').
// - summary.paidAmounts·refundedAmounts: 통화별 합계 { KRW, USD } (없는 통화는
//   빠짐). paidAmount·refundedAmount 는 원화 합계 (하위 호환).

import { paymentMethodLabel } from '../../lib/money.js'

const EMPTY_DIARY = {
  id: null,
  name: null,
  first: false,
  pages: 0,
  completedAt: null,
  deleted: true,
}

export function paymentFromApi(raw) {
  const status =
    raw.status === 'paid' && raw.refundRequested
      ? 'refund-requested'
      : raw.status
  return {
    id: raw.id,
    orderId: raw.orderId ?? '',
    member: {
      id: raw.member?.id ?? null,
      nickname: raw.member?.nickname ?? '(알 수 없음)',
      email: raw.member?.email ?? '(이메일 없음 · 탈퇴 회원)',
    },
    diary: raw.diary ? { ...EMPTY_DIARY, ...raw.diary } : { ...EMPTY_DIARY },
    amount: Number(raw.amount ?? 0),
    currency: raw.currency ?? 'KRW',
    provider: raw.provider ?? 'toss',
    status,
    createdAt: raw.createdAt,
    paidAt: raw.paidAt ?? null,
    refundedAt: raw.refundedAt ?? null,
    refundConsentAt: raw.refundConsentAt ?? null,
    editedAt: raw.editedAt ?? null,
    refundRequested: Boolean(raw.refundRequested),
    refundRequestId: raw.refundRequestId ?? null,
    method: raw.method ? String(raw.method).toUpperCase() : null,
    methodDetail: raw.methodDetail ?? null,
    methodLabel: paymentMethodLabel(raw.method, raw.methodDetail),
    sameDiaryPayments: Number(raw.sameDiaryPayments ?? 0),
  }
}

export function paymentDetailFromApi(raw) {
  return {
    ...paymentFromApi(raw),
    paymentKey: raw.paymentKey ?? null,
    tossCancelKey: raw.tossCancelKey ?? null,
    failureCode: raw.failureCode ?? null,
    failureMessage: raw.failureMessage ?? null,
    refundRequest: raw.refundRequest ?? null,
  }
}

export function paymentPageFromApi(raw) {
  return {
    items: (raw?.items ?? []).map(paymentFromApi),
    page: Number(raw?.page ?? 0),
    size: Number(raw?.size ?? 0),
    totalElements: Number(raw?.totalElements ?? 0),
    summary: {
      paidCount: Number(raw?.summary?.paidCount ?? 0),
      paidAmount: Number(raw?.summary?.paidAmount ?? 0),
      refundedCount: Number(raw?.summary?.refundedCount ?? 0),
      refundedAmount: Number(raw?.summary?.refundedAmount ?? 0),
      paidAmounts: amountsFromApi(
        raw?.summary?.paidAmounts,
        raw?.summary?.paidAmount,
      ),
      refundedAmounts: amountsFromApi(
        raw?.summary?.refundedAmounts,
        raw?.summary?.refundedAmount,
      ),
    },
  }
}

// { KRW: 6000, USD: 2.99 } (숫자로). #59 전 서버면 원화 합계만.
function amountsFromApi(amounts, krwFallback) {
  if (!amounts) return { KRW: Number(krwFallback ?? 0) }
  return Object.fromEntries(
    Object.entries(amounts).map(([currency, amount]) => [
      currency,
      Number(amount ?? 0),
    ]),
  )
}
