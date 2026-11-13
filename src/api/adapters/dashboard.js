import { inquiryFromApi } from './inquiry.js'
import { paymentFromApi } from './payment.js'
import { refundRequestFromApi } from './refund.js'

// 백엔드 대시보드 DTO (AdminDashboardResponse, docs/admin-ops.md 4절) → 화면
// 형태 (api/dashboard.js 참고). 앞의 6개 필드는 백엔드가 mock 과 같은 이름·
// 구조로 주므로 얇다.
//
// - payments.*.revenue: 원화만 (mock 호환). 통화별 합계는 revenues
//   { KRW, USD } — 없으면 revenue 로 { KRW } 를 만든다.
// - pendingRefunds[]: mock 필드 + currency·deadline. amount·currency 는
//   결제를 못 찾으면 null, nickname 은 회원을 못 찾으면 null → 화면이 "—".
// - pendingInquiries[].nickname: 회원을 못 찾으면 null → 화면이 "—".
// - survey.averageRating: 별점 질문·응답이 없으면 null → 화면이 "—".
// - 기간 지표(range·from·to·members·diaries·sales·pending)는 그대로,
//   recent.* 는 각 목록 어댑터로 바꿔 붙인다 (화면은 아직 안 씀).

const toNumber = (value) => (value == null ? null : Number(value))

function amountsFromApi(raw, fallbackKrw) {
  if (raw && typeof raw === 'object') {
    return Object.fromEntries(
      Object.entries(raw).map(([currency, amount]) => [
        currency,
        Number(amount ?? 0),
      ]),
    )
  }
  return { KRW: Number(fallbackKrw ?? 0) }
}

function monthFromApi(raw) {
  return {
    paymentCount: Number(raw?.paymentCount ?? 0),
    revenue: Number(raw?.revenue ?? 0),
    revenues: amountsFromApi(raw?.revenues, raw?.revenue),
  }
}

export function dashboardFromApi(raw) {
  return {
    signups: {
      today: Number(raw.signups?.today ?? 0),
      yesterday: Number(raw.signups?.yesterday ?? 0),
    },
    payments: {
      thisMonth: monthFromApi(raw.payments?.thisMonth),
      lastMonth: monthFromApi(raw.payments?.lastMonth),
    },
    daily: (raw.daily ?? []).map((d) => ({
      date: d.date,
      signups: Number(d.signups ?? 0),
      payments: Number(d.payments ?? 0),
    })),
    pendingInquiries: (raw.pendingInquiries ?? []).map((i) => ({
      id: i.id,
      category: i.category ? String(i.category).toLowerCase() : 'other',
      title: i.title,
      nickname: i.nickname ?? null,
      createdAt: i.createdAt,
    })),
    pendingRefunds: (raw.pendingRefunds ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      nickname: r.nickname ?? null,
      amount: toNumber(r.amount),
      currency: r.currency ?? null,
      createdAt: r.createdAt,
      deadline: r.deadline ?? null,
    })),
    survey: {
      averageRating: toNumber(raw.survey?.averageRating),
      responsesThisWeek: Number(raw.survey?.responsesThisWeek ?? 0),
      responsesInRange: Number(raw.survey?.responsesInRange ?? 0),
    },
    range: raw.range,
    from: raw.from,
    to: raw.to,
    members: raw.members ?? null,
    diaries: raw.diaries ?? null,
    sales: raw.sales ?? null,
    pending: raw.pending ?? null,
    recent: {
      payments: (raw.recent?.payments ?? []).map(paymentFromApi),
      inquiries: (raw.recent?.inquiries ?? []).map(inquiryFromApi),
      refundRequests: (raw.recent?.refundRequests ?? []).map(
        refundRequestFromApi,
      ),
    },
  }
}
