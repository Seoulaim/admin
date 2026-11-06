import { ApiError } from '../lib/apiClient.js'
import { inquiryErrorCode } from './adapters/inquiry.js'
import { refundRequestFromApi } from './adapters/refund.js'
import { request } from './client.js'

// 환불 관리: refund requests — Help Center inquiries of the refund type,
// each naming the payment the member picked (MR03). Refunds only start
// from a request.
//
// Refund request: { id (the inquiry's), author, language, title, content,
//   photoUrls, createdAt (when asked), refund, payment, policy,
//   refundWithinPolicy, deadline }
// - refund: { status: 'requested' | 'refunded' | 'rejected', decidedAt,
//   adminName, exception: { reason, memo } | null, rejectReason }
// - author: { id, nickname, email, joinedAt, appLanguage, diaryCount,
//   paidPaymentCount, refundedCount, rejectedRefundCount,
//   pendingInquiryCount, withdrawn }
// - payment: { id, orderId, amount, provider, paidAt, refundConsentAt,
//   editedAt, diary: { id, name, first, pages, completedAt, createdAt,
//   saveCount, lastSavedAt, photoCount, pageUrls, thumbnailUrl,
//   downloads: [{ format, pageCount, at }], deleted } }
// - policy: the server's check, judged now — { within7Days: { ok, paidAt,
//   deadlineAt }, notEdited: { ok, editedAt }, notFinalized: { ok,
//   finalizedAt }, notDownloaded: { ok, downloadCount, lastDownloadedAt },
//   allOk } — or null when the payment can't be found.
// - refundWithinPolicy: the server's own verdict, which decides, even when
//   policy looks fine (see the editedAt clean-up in docs/admin-api.md). A member
//   can ask within 7 days even after editing; it arrives marked false.
// - deadline: last day to handle it (제6조, 3 business days).
//
// Approving is the backend's job end to end: cancel the Toss payment
// (POST /v1/payments/{paymentKey}/cancel with the secret key), then
// lock pages 3+ of a first diary (paid: false, content kept) or delete any
// other diary with its photos, and email the member. A refund outside the
// policy is only accepted with an exception (reason + memo), kept for
// accounting and disputes.

// 백엔드: /api/v1/admin/refund-requests (domain/inquiry/admin,
// docs/inquiry-flow.md). 형태 변환은 adapters/refund.js.
// refundWithinPolicy(신청 시점)·policy(지금)·deadline 모두 백엔드 값.

const BASE = '/api/v1/admin/refund-requests'

async function call(path, options) {
  try {
    return await request(path, options)
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(inquiryErrorCode(error.code), {
        status: error.status,
        details: error.details,
      })
    }
    throw error
  }
}

// Waiting ones first (oldest first — closest deadline), then decided ones,
// newest first. (백엔드가 이 순서로 준다.)
export async function getRefundRequests() {
  return ((await call(BASE)) ?? []).map(refundRequestFromApi)
}

export async function getRefundRequest(id) {
  return refundRequestFromApi(await call(`${BASE}/${id}`))
}

// exception: { reason, memo } — required when the request is outside the
// policy ('POLICY_EXCEPTION_REQUIRED' otherwise). Rejects with
// 'ALREADY_DECIDED', or 'REFUND_FAILED' when Toss refuses the cancel —
// error.details: { code, message } from Toss (백엔드 fields).
export async function approveRefund(id, exception = null) {
  return refundRequestFromApi(
    await call(`${BASE}/${id}/approve`, {
      method: 'POST',
      body: exception ? { exception } : {},
    }),
  )
}

// reason: emailed to the member.
export async function rejectRefund(id, reason) {
  return refundRequestFromApi(
    await call(`${BASE}/${id}/reject`, { method: 'POST', body: { reason } }),
  )
}
