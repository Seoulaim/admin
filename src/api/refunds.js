import { checkRefundPolicy, processingDeadline } from '../lib/refunds.js'
import { admin, inquiries, payments } from '../mocks/db.js'
import { ApiError, handle } from '../mocks/server.js'

// 환불 관리: refund requests — Help Center inquiries of the refund type,
// each naming the payment the member picked (MR03). Refunds only start
// from a request.
//
// Refund request: { id (the inquiry's), author, language, title, content,
//   photoUrls, createdAt (when asked), refund, payment, policy, deadline }
// - refund: { status: 'requested' | 'refunded' | 'rejected', decidedAt,
//   adminName, exception: { reason, memo } | null, rejectReason }
// - payment: { id, orderId, amount, provider, paidAt, refundConsentAt,
//   diary: { id, name, first, pages, finishedAt } }
// - policy: checkRefundPolicy — 제3조 judged at the time of the request.
// - deadline: last day to handle it (제6조, 3 business days).
//
// Approving is the backend's job end to end: cancel the Toss payment
// (POST /v1/payments/{paymentKey}/cancel with the secret key), then
// lock pages 3+ of a first diary (paid: false, content kept) or delete any
// other diary with its photos, and email the member. A refund outside the
// policy is only accepted with an exception (reason + memo), kept for
// accounting and disputes.

function view(inquiry) {
  const payment = payments.find((p) => p.id === inquiry.paymentId)
  return {
    id: inquiry.id,
    author: inquiry.author,
    language: inquiry.language,
    title: inquiry.title,
    content: inquiry.content,
    photoUrls: inquiry.photoUrls,
    createdAt: inquiry.createdAt,
    refund: inquiry.refund,
    payment,
    policy: checkRefundPolicy(payment, inquiry.createdAt),
    deadline: processingDeadline(inquiry.createdAt),
  }
}

function find(id) {
  const inquiry = inquiries.find((i) => i.id === id && i.category === 'refund')
  if (!inquiry) throw new ApiError('NOT_FOUND')
  return inquiry
}

// Waiting ones first (oldest first — closest deadline), then decided ones,
// newest first.
export function getRefundRequests() {
  return handle(() => {
    const all = inquiries.filter((i) => i.category === 'refund').map(view)
    const waiting = all
      .filter((r) => r.refund.status === 'requested')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const decided = all
      .filter((r) => r.refund.status !== 'requested')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return [...waiting, ...decided]
  })
}

export function getRefundRequest(id) {
  return handle(() => view(find(id)))
}

function decide(id, fields) {
  const inquiry = find(id)
  if (inquiry.refund.status !== 'requested')
    throw new ApiError('ALREADY_DECIDED')
  inquiry.refund = {
    ...inquiry.refund,
    ...fields,
    decidedAt: new Date().toISOString(),
    adminName: admin.name,
  }
  inquiry.status = 'answered'
  return view(inquiry)
}

// exception: { reason, memo } — required when the request is outside the
// policy ('POLICY_EXCEPTION_REQUIRED' otherwise). Rejects with
// 'ALREADY_DECIDED', or 'REFUND_FAILED' when Toss refuses the cancel.
export function approveRefund(id, exception = null) {
  return handle(() => {
    const inquiry = find(id)
    if (!view(inquiry).policy.ok && !exception) {
      throw new ApiError('POLICY_EXCEPTION_REQUIRED')
    }
    return decide(id, { status: 'refunded', exception })
  }, 900)
}

// reason: emailed to the member.
export function rejectRefund(id, reason) {
  return handle(
    () => decide(id, { status: 'rejected', rejectReason: reason }),
    600,
  )
}
