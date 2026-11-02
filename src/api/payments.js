import { inquiries, payments } from '../mocks/db.js'
import { handle } from '../mocks/server.js'

// 결제 관리: every diary payment, newest first.
// Payment: { id, orderId, member: { id, nickname, email }, amount,
//   provider ('toss'), paidAt, refundConsentAt,
//   editedAt: first edit after paying (POST /diaries/{id}/edited), or null.
//     On a first diary only pages 3+ count: pages 1–2 are free to change,
//     before or after paying. Per payment: a first diary paid again after a
//     refund has two, and edits go on the unrefunded one, whose 7 days and
//     edit history start over,
//   diary: { id, name, first, pages, completedAt },
//   status: 'paid' | 'refund-requested' | 'refunded',
//   refundRequestId: the refund inquiry, if any,
//   sameDiaryPayments: other unrefunded payments of the same diary when
//     this one is unrefunded too (more than zero hints at a duplicate
//     charge; paying again after a refund isn't one) }
// Compare with the Toss Payments console by orderId.
export function getPayments() {
  return handle(() =>
    [...payments]
      .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
      .map((payment) => {
        const request = inquiries.find(
          (i) => i.category === 'refund' && i.paymentId === payment.id,
        )
        const status =
          request?.refund.status === 'refunded'
            ? 'refunded'
            : request?.refund.status === 'requested'
              ? 'refund-requested'
              : 'paid'
        return { ...payment, status, refundRequestId: request?.id ?? null }
      })
      .map((payment, _, all) => ({
        ...payment,
        sameDiaryPayments: all.filter(
          (p) =>
            payment.status !== 'refunded' &&
            p.id !== payment.id &&
            p.diary.id === payment.diary.id &&
            p.status !== 'refunded',
        ).length,
      })),
  )
}
