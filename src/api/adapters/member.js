import { paymentMethodLabel } from '../../lib/money.js'
import { imageUrlFromKey } from './image.js'

// 백엔드 어드민 회원 DTO (AdminUserListResponse·AdminUserDetailResponse,
// docs/admin-ops.md 2절) → 화면 형태 (api/members.js 참고).
//
// 백엔드에 없어 기본값으로 채우는 필드 (화면은 null 이면 숨김·'-'):
// - 목록: maskedName(null), lastSeenAt(null), biasGroupIds([]),
//   marketing(null)
// - 상세: name(null), lastSeenAt(null), plan(null), survey(null),
//   consents.terms·privacy·age(null), notifications.service(null),
//   views([]), diaries[].pages(null)
// 백엔드 값으로 만드는 것:
// - history: 가입·마케팅 설정 변경·탈퇴(withdrawnAt·withdrawnBy·사유)
// - payments[].diary.name: 같은 응답의 diaries 에서 diaryId 로 찾는다
// - inquiries[].refund: refundStatus 가 있으면 { status }

export function memberRowFromApi(raw) {
  return {
    id: raw.id,
    nickname: raw.nickname ?? '(알 수 없음)',
    maskedName: null,
    maskedEmail: raw.emailMasked ?? null,
    language: raw.language ?? 'en',
    joinedAt: raw.joinedAt,
    lastSeenAt: null,
    biasGroupIds: [],
    marketing: null,
    diaryCount: Number(raw.diaryCount ?? 0),
    paidCount: Number(raw.paidPaymentCount ?? 0),
    status: raw.status ?? 'active',
  }
}

export function memberPageFromApi(raw) {
  return {
    items: (raw?.items ?? []).map(memberRowFromApi),
    page: Number(raw?.page ?? 0),
    size: Number(raw?.size ?? 0),
    totalElements: Number(raw?.totalElements ?? 0),
  }
}

const WITHDRAWN_BY = { admin: '어드민 강퇴', self: '본인 탈퇴' }

function historyFromApi(raw) {
  const history = [{ at: raw.joinedAt, event: '가입', detail: '' }]
  if (raw.marketingUpdatedAt) {
    history.push({
      at: raw.marketingUpdatedAt,
      event: '마케팅 수신 설정',
      detail: raw.marketingConsent ? '동의' : '거부',
    })
  }
  if (raw.withdrawnAt) {
    history.push({
      at: raw.withdrawnAt,
      event: '탈퇴',
      detail: [
        WITHDRAWN_BY[raw.withdrawnBy] ?? raw.withdrawnBy,
        raw.withdrawReason,
      ]
        .filter(Boolean)
        .join(' · '),
    })
  }
  return history.filter((h) => h.at).sort((a, b) => a.at.localeCompare(b.at))
}

export function memberFromApi(raw) {
  const diaries = (raw.diaries ?? []).map((d) => ({
    id: d.id,
    name: d.deleted ? null : (d.name ?? null),
    first: Boolean(d.free),
    paid: Boolean(d.paid),
    pages: null,
    completedAt: d.finalized ? (d.finalizedAt ?? d.lastSavedAt) : null,
    createdAt: d.createdAt ?? null,
    lastSavedAt: d.lastSavedAt ?? null,
    saveCount: Number(d.saveCount ?? 0),
    downloadCount: Number(d.downloadCount ?? 0),
    deleted: Boolean(d.deleted),
  }))
  const diaryName = (id) => diaries.find((d) => d.id === id)?.name ?? null

  return {
    id: raw.id,
    nickname: raw.nickname ?? '(알 수 없음)',
    name: null,
    email: raw.email ?? null,
    profileImageUrl: imageUrlFromKey(raw.profileImageKey),
    language: raw.language ?? 'en',
    joinedAt: raw.joinedAt,
    lastSeenAt: null,
    status: raw.status ?? 'active',
    withdrawnAt: raw.withdrawnAt ?? null,
    withdrawnBy: raw.withdrawnBy ?? null,
    withdrawReason: raw.withdrawReason ?? null,
    biases: (raw.biases ?? []).map((b) => ({
      id: b.id,
      name: {
        en: b.nameEn ?? '',
        ko: b.nameKo ?? '',
        zh: b.nameZh ?? '',
        ja: b.nameJa ?? '',
      },
      group: {
        en: b.artistGroup?.nameEn ?? '',
        ko: b.artistGroup?.nameKo ?? '',
      },
    })),
    plan: null,
    diaries,
    payments: (raw.payments ?? []).map((p) => ({
      id: p.id,
      orderId: p.orderNumber,
      amount: Number(p.amount ?? 0),
      currency: p.currency ?? 'KRW',
      method: p.method ? String(p.method).toUpperCase() : null,
      methodLabel: paymentMethodLabel(p.method),
      status: p.status,
      paidAt: p.paidAt ?? null,
      refundedAt: p.refundedAt ?? null,
      diary: { id: p.diaryId, name: diaryName(p.diaryId) },
    })),
    inquiries: (raw.inquiries ?? []).map((i) => ({
      id: i.id,
      category: i.category,
      title: i.title ?? '',
      status: i.status,
      createdAt: i.createdAt,
      refund: i.refundStatus ? { status: i.refundStatus } : null,
    })),
    consents: {
      terms: null,
      privacy: null,
      age: null,
      marketing: {
        agreed: Boolean(raw.marketingConsent),
        at: raw.marketingUpdatedAt ?? null,
      },
    },
    notifications: {
      service: null,
      marketing: Boolean(raw.marketingConsent),
      // 가입 후 바꾼 적 없으면 null → 가입 시각을 기준으로 본다.
      marketingUpdatedAt: raw.marketingUpdatedAt ?? raw.joinedAt,
      push: Boolean(raw.pushEnabled),
    },
    stats: {
      refundedCount: Number(raw.stats?.refundedCount ?? 0),
      rejectedRefundCount: Number(raw.stats?.rejectedRefundCount ?? 0),
      pendingInquiryCount: Number(raw.stats?.pendingInquiryCount ?? 0),
    },
    history: historyFromApi(raw),
    views: [],
    survey: null,
  }
}
