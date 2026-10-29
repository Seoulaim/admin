import { dailyStats, inquiries, monthStats, payments } from '../mocks/db.js'
import { headlineRating } from '../lib/survey.js'
import { handle } from '../mocks/server.js'
import { responses, survey } from '../mocks/survey.js'

// Dashboard summary:
// { signups: { today, yesterday },
//   payments: { thisMonth: { paymentCount, revenue }, lastMonth: {…} },
//   daily: [{ date, signups, payments }] — last 14 days, oldest first,
//   pendingInquiries: [{ id, category, title, nickname, createdAt }] — not
//     answered yet, refund inquiries left out, newest first,
//   pendingRefunds: [{ id, title, nickname, amount, createdAt }] — refund
//     inquiries not handled yet, newest first. amount: the payment's (won).
//   survey: { averageRating (first rating question, all time) | null,
//     responsesThisWeek } — plan satisfaction survey.
// }
export function getDashboard() {
  return handle(() => {
    const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt)
    const [yesterday, today] = dailyStats.slice(-2)

    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()
    return {
      survey: {
        averageRating: headlineRating(survey.questions, responses),
        responsesThisWeek: responses.filter((r) => r.submittedAt > weekAgo)
          .length,
      },
      signups: { today: today.signups, yesterday: yesterday.signups },
      payments: monthStats,
      daily: dailyStats,
      pendingInquiries: inquiries
        .filter((i) => i.category !== 'refund' && i.status === 'received')
        .sort(newestFirst)
        .map(({ id, category, title, author, createdAt }) => ({
          id,
          category,
          title,
          nickname: author.nickname,
          createdAt,
        })),
      pendingRefunds: inquiries
        .filter(
          (i) => i.category === 'refund' && i.refund.status === 'requested',
        )
        .sort(newestFirst)
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
