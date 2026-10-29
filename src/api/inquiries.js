import { admin, inquiries } from '../mocks/db.js'
import { ApiError, handle } from '../mocks/server.js'

// Help Center inquiries (MR03) other than refunds — those are handled in
// 환불 관리 (api/refunds.js).
// Inquiry: { id, author: { id, nickname, email }, language, category, title,
//   content, photoUrls, createdAt, status, answers, memo }
// - language: the app language the member wrote in, to answer in.
// - status: 'received' | 'answered'.
// - answers: [{ id, body, sentAt, adminName }] — each was emailed to the
//   member (the backend sends it; mail is the only channel, no push).
// - memo: an admin-only note, never sent.

const isRefund = (inquiry) => inquiry.category === 'refund'

function find(id) {
  const inquiry = inquiries.find((i) => i.id === id && !isRefund(i))
  if (!inquiry) throw new ApiError('NOT_FOUND')
  return inquiry
}

// Newest first, with refundCount: refund inquiries waiting in 환불 관리.
export function getInquiries() {
  return handle(() => ({
    inquiries: inquiries
      .filter((i) => !isRefund(i))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    refundCount: inquiries.filter(
      (i) => isRefund(i) && i.refund.status === 'requested',
    ).length,
  }))
}

// Rejects with 'NOT_FOUND'.
export function getInquiry(id) {
  return handle(() => find(id))
}

// Emails `body` to the member and marks the inquiry answered. Resolves with
// the updated inquiry.
export function answerInquiry(id, body) {
  return handle(() => {
    const inquiry = find(id)
    inquiry.answers.push({
      id: `an-${Date.now()}`,
      body,
      sentAt: new Date().toISOString(),
      adminName: admin.name,
    })
    inquiry.status = 'answered'
    return inquiry
  }, 600)
}

export function saveInquiryMemo(id, memo) {
  return handle(() => {
    find(id).memo = memo
  })
}
