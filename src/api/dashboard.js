import { dashboardFromApi } from './adapters/dashboard.js'
import { request } from './client.js'

// Dashboard summary:
// { signups: { today, yesterday },
//   payments: { thisMonth: { paymentCount, revenue (KRW only),
//     revenues: { KRW, USD } }, lastMonth: {…} },
//   daily: [{ date, signups, payments }] — last 14 days, oldest first,
//   pendingInquiries: [{ id, category, title, nickname | null, createdAt }]
//     — not answered yet, refund inquiries left out, newest first,
//   pendingRefunds: [{ id, title, nickname | null, amount | null,
//     currency (KRW | USD) | null, createdAt, deadline }] — refund
//     inquiries not handled yet, newest first. amount: the payment's, in
//     its currency's unit.
//   survey: { averageRating (first rating question, all time) | null,
//     responsesThisWeek, responsesInRange } — plan satisfaction survey.
//   range ('7d' | '30d' | '90d'), from, to (YYYY-MM-DD, KST),
//   members, diaries, sales, pending, recent — range metrics
//     (docs/admin-ops.md 4절 of the backend; the screen doesn't use them yet).
// }
//
// 백엔드: GET /api/v1/admin/dashboard?range= (domain/dashboard,
// docs/admin-ops.md 4절). 형태 변환은 adapters/dashboard.js.
// range 를 안 주면 백엔드 기본 7d.
export async function getDashboard({ range } = {}) {
  const query = range ? `?range=${encodeURIComponent(range)}` : ''
  return dashboardFromApi(await request(`/api/v1/admin/dashboard${query}`))
}
