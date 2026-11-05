import { checkRefundPolicy } from '../../lib/refunds.js'
import { authorFromApi, photoUrlsFromKeys } from './inquiry.js'

// 백엔드 환불 요청 DTO (AdminRefundRequestResponse) → 화면 형태
// (api/refunds.js 참고). 백엔드가 이미 mock 형태로 주므로 얇다.
//
// - refundWithinPolicy·deadline: 백엔드 값을 그대로 쓴다 (승인 조건과 처리
//   기한은 서버 판정이 우선).
// - policy: 백엔드에 없음 → 화면의 "환불 정책 확인" 체크 항목용으로만
//   lib/refunds.js 의 checkRefundPolicy 로 계산한다 (판정에는 안 씀).
// - photoKeys → photoUrls.
// - payment.diary: 다이어리를 못 찾으면 백엔드가 null → 삭제된 다이어리로
//   채운다 (name null 이면 화면이 '(삭제됨)'). payment 자체가 null 이면
//   0원 빈 결제로 채운다 (정상 데이터에서는 없음).

const EMPTY_DIARY = {
  id: null,
  name: null,
  first: false,
  pages: 0,
  completedAt: null,
}

function paymentFromApi(raw, createdAt) {
  return {
    id: raw?.id ?? null,
    orderId: raw?.orderId ?? '',
    amount: Number(raw?.amount ?? 0),
    provider: raw?.provider ?? 'toss',
    paidAt: raw?.paidAt ?? createdAt,
    refundConsentAt: raw?.refundConsentAt ?? null,
    editedAt: raw?.editedAt ?? null,
    diary: raw?.diary ? { ...EMPTY_DIARY, ...raw.diary } : { ...EMPTY_DIARY },
  }
}

export function refundRequestFromApi(raw) {
  const payment = paymentFromApi(raw.payment, raw.createdAt)
  return {
    id: raw.id,
    author: authorFromApi(raw.author),
    language: raw.language ?? 'en',
    title: raw.title ?? '',
    content: raw.content ?? '',
    photoUrls: photoUrlsFromKeys(raw.photoKeys),
    createdAt: raw.createdAt,
    refund: {
      status: raw.refund?.status ?? 'requested',
      decidedAt: raw.refund?.decidedAt ?? null,
      adminName: raw.refund?.adminName ?? null,
      exception: raw.refund?.exception ?? null,
      rejectReason: raw.refund?.rejectReason ?? null,
    },
    payment,
    policy: checkRefundPolicy(payment, raw.createdAt),
    refundWithinPolicy: Boolean(raw.refundWithinPolicy),
    deadline: raw.deadline,
  }
}
