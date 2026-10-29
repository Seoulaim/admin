import { dailyStats, inquiries, monthStats, payments } from '../mocks/db.js'
import { handle } from '../mocks/server.js'

// Dashboard summary:
// { signups: { today, yesterday },
//   payments: { thisMonth: { paymentCount, revenue }, lastMonth: {…} },
//   daily: [{ date, signups, payments }] — last 14 days, oldest first,
//   pendingInquiries: [{ id, category, title, nickname, createdAt }] — not
//     answered yet, refund inquiries left out, newest first,
//   pendingRefunds: [{ id, title, nickname, amount, createdAt }] — refund
//     inquiries not handled yet, newest first. amount: the payment's (won).
// }
export function getDashboard() {
  return handle(() => {
    const pending = inquiries
      .filter((inquiry) => inquiry.status === 'received')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const [yesterday, today] = dailyStats.slice(-2)

    return {
      signups: { today: today.signups, yesterday: yesterday.signups },
      payments: monthStats,
      daily: dailyStats,
      pendingInquiries: pending
        .filter((inquiry) => inquiry.category !== 'refund')
        .map(({ id, category, title, author, createdAt }) => ({
          id,
          category,
          title,
          nickname: author.nickname,
          createdAt,
        })),
      pendingRefunds: pending
        .filter((inquiry) => inquiry.category === 'refund')
        .map(({ id, title, author, paymentId, createdAt }) => ({
          id,
          title,
          nickname: author.nickname,
          amount: payments.find((p) => p.id === paymentId).amount,
          createdAt,
        })),
    }
  })
}
