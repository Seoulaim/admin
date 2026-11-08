import { paymentMethodLabel } from '../../lib/money.js'
import { imageUrlFromKey } from './image.js'
import { authorFromApi, photoUrlsFromKeys } from './inquiry.js'

// 백엔드 환불 요청 DTO (AdminRefundRequestResponse) → 화면 형태
// (api/refunds.js 참고). 백엔드가 이미 mock 형태로 주므로 얇다.
//
// - refundWithinPolicy·deadline: 백엔드 값 (신청 시점 판정, 승인 조건).
// - policy: 백엔드 RefundPolicyCheck 그대로 (지금 시점 판정). 결제를 못
//   찾으면 백엔드가 null → 화면도 null 로 받아 "판정할 수 없음" 표시.
// - photoKeys → photoUrls, diary.pageKeys → pageUrls, thumbnailKey →
//   thumbnailUrl.
// - payment.diary: 다이어리를 못 찾으면 백엔드가 null → 삭제된 다이어리로
//   채운다 (deleted: true, name null). payment 자체가 null 이면 0원 빈
//   결제로 채운다 (정상 데이터에서는 없음).
// - author: 계정 이력(가입일·다이어리 수·결제 수·환불 승인/거절 수·미답변
//   문의 수)을 그대로 붙인다.

const EMPTY_DIARY = {
  id: null,
  name: null,
  first: false,
  pages: 0,
  completedAt: null,
  createdAt: null,
  saveCount: 0,
  lastSavedAt: null,
  photoCount: 0,
  pageUrls: [],
  thumbnailUrl: '',
  downloads: [],
  deleted: true,
}

function diaryFromApi(raw) {
  if (!raw) return { ...EMPTY_DIARY }
  return {
    id: raw.id,
    name: raw.name ?? null,
    first: Boolean(raw.first),
    pages: Number(raw.pages ?? 0),
    completedAt: raw.completedAt ?? null,
    createdAt: raw.createdAt ?? null,
    saveCount: Number(raw.saveCount ?? 0),
    lastSavedAt: raw.lastSavedAt ?? null,
    photoCount: Number(raw.photoCount ?? 0),
    pageUrls: photoUrlsFromKeys(raw.pageKeys),
    thumbnailUrl: imageUrlFromKey(raw.thumbnailKey),
    downloads: (raw.downloads ?? []).map((d) => ({
      format: d.format,
      pageCount: Number(d.pageCount ?? 0),
      at: d.at,
    })),
    deleted: Boolean(raw.deleted),
  }
}

function paymentFromApi(raw, createdAt) {
  return {
    id: raw?.id ?? null,
    orderId: raw?.orderId ?? '',
    amount: Number(raw?.amount ?? 0),
    currency: raw?.currency ?? 'KRW',
    method: raw?.method ? String(raw.method).toUpperCase() : null,
    methodLabel: paymentMethodLabel(raw?.method),
    provider: raw?.provider ?? 'toss',
    paidAt: raw?.paidAt ?? createdAt,
    refundConsentAt: raw?.refundConsentAt ?? null,
    editedAt: raw?.editedAt ?? null,
    diary: diaryFromApi(raw?.diary),
  }
}

function refundAuthorFromApi(raw) {
  return {
    ...authorFromApi(raw),
    joinedAt: raw?.joinedAt ?? null,
    appLanguage: raw?.language ?? null,
    diaryCount: Number(raw?.diaryCount ?? 0),
    paidPaymentCount: Number(raw?.paidPaymentCount ?? 0),
    refundedCount: Number(raw?.refundedCount ?? 0),
    rejectedRefundCount: Number(raw?.rejectedRefundCount ?? 0),
    pendingInquiryCount: Number(raw?.pendingInquiryCount ?? 0),
    withdrawn: Boolean(raw?.withdrawn),
  }
}

export function refundRequestFromApi(raw) {
  return {
    id: raw.id,
    author: refundAuthorFromApi(raw.author),
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
    payment: paymentFromApi(raw.payment, raw.createdAt),
    policy: raw.policy ?? null,
    refundWithinPolicy: Boolean(raw.refundWithinPolicy),
    deadline: raw.deadline,
  }
}
