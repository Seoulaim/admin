import { inquiries, payments } from '../mocks/db.js'
import { handle } from '../mocks/server.js'

// 결제 관리: every diary payment, newest first.
// Payment: { id, orderId, member: { id, nickname, email }, amount,
//   provider ('toss'), paidAt, refundConsentAt,
//   diary: { id, name, first, pages, finishedAt, reopened },
//   status: 'paid' | 'refund-requested' | 'refunded',
//   refundRequestId: the refund inquiry, if any,
//   sameDiaryPayments: other unrefunded payments of the same diary
//     (more than zero hints at a duplicate charge) }
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
            p.id !== payment.id &&
            p.diary.id === payment.diary.id &&
            p.status !== 'refunded',
        ).length,
      })),
  )
}
