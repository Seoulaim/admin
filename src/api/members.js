import { groups } from '../mocks/artists.js'
import { admin, inquiries, payments } from '../mocks/db.js'
import { memberViews, members, withdrawals } from '../mocks/members.js'
import { ApiError, handle } from '../mocks/server.js'
import { responses, survey } from '../mocks/survey.js'
import { maskEmail, maskName } from '../lib/privacy.js'

// 회원 관리. The list hides personal details partly (maskEmail / maskName);
// the detail has them in full, and every opening is logged (who, when) —
// the backend keeps that log (개인정보 접속기록).
//
// List row: { id, nickname, maskedName, maskedEmail, language, joinedAt,
//   lastSeenAt, biasGroupIds, marketing, paidCount }
// Detail: the member (see mocks/members.js) plus
//   biases: [{ id, name, group }], diaries, payments, inquiries, views,
//   survey: { questions, response } | null — their satisfaction survey
//   answer (questions to read it with).
// Withdrawing (강퇴) deletes the account and its diaries, photos and plan;
// payment records stay (전자상거래법: 5 years). A record of the withdrawal
// is kept without personal details.

const memberName = (id) => {
  for (const group of groups) {
    const member = group.members.find((m) => m.id === id)
    if (member) return { id, name: member.name, group: group.name }
  }
  return { id, name: { en: id }, group: { en: '' } }
}

function find(id) {
  const member = members.find((m) => m.id === id)
  if (!member) throw new ApiError('NOT_FOUND')
  return member
}

// Newest sign-up first. query: matches nickname, name, member id or email
// (searched on the server, so the list never carries full emails).
export function getMembers(query = '') {
  const q = query.trim().toLowerCase()
  return handle(() =>
    members
      .filter(
        (m) =>
          !q ||
          [m.nickname, m.name, m.id, m.email].some((text) =>
            text.toLowerCase().includes(q),
          ),
      )
      .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
      .map((m) => ({
        id: m.id,
        nickname: m.nickname,
        maskedName: maskName(m.name),
        maskedEmail: maskEmail(m.email),
        language: m.language,
        joinedAt: m.joinedAt,
        lastSeenAt: m.lastSeenAt,
        biasGroupIds: m.biasGroupIds,
        marketing: m.notifications.marketing,
        paidCount: payments.filter((p) => p.member.id === m.id).length,
      })),
  )
}

// Opening the detail is logged. Rejects with 'NOT_FOUND'.
export function getMember(id) {
  return handle(() => {
    const member = find(id)
    const last = memberViews.at(-1)
    // One opening = one entry (the mock can be asked twice in development).
    if (!(last?.memberId === id && Date.now() - new Date(last.at) < 2000)) {
      memberViews.push({
        memberId: id,
        at: new Date().toISOString(),
        adminName: admin.name,
      })
    }
    const own = payments.filter((p) => p.member.id === id)
    const paidDiaries = [
      ...new Map(
        own.map((p) => [p.diary.id, { ...p.diary, paid: true }]),
      ).values(),
    ]
    return {
      ...member,
      biases: member.biasIds.map(memberName),
      diaries: [
        ...(member.freeDiary ? [{ ...member.freeDiary, paid: false }] : []),
        ...paidDiaries,
      ],
      payments: own.sort((a, b) => b.paidAt.localeCompare(a.paidAt)),
      inquiries: inquiries
        .filter((i) => i.author.id === id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      views: memberViews.filter((v) => v.memberId === id).reverse(),
      survey: (() => {
        const response = responses.find((r) => r.memberId === id)
        return response ? { questions: survey.questions, response } : null
      })(),
    }
  })
}

// Things to settle before withdrawing: { pendingRefunds, recentPayments }
// — refund requests still waiting, and payments within the refund period.
export function getWithdrawalChecks(id) {
  return handle(() => {
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()
    return {
      pendingRefunds: inquiries.filter(
        (i) =>
          i.author.id === id &&
          i.category === 'refund' &&
          i.refund.status === 'requested',
      ).length,
      recentPayments: payments.filter(
        (p) => p.member.id === id && p.paidAt > weekAgo,
      ).length,
    }
  })
}

// 강퇴. reason: one of WITHDRAWAL_REASONS' ids; memo: what happened
// (required). The member gets the "탈퇴 완료" mail with the reason.
export function withdrawMember(id, reason, memo) {
  return handle(() => {
    const member = find(id)
    members.splice(members.indexOf(member), 1)
    withdrawals.unshift({
      memberId: id,
      nickname: maskName(member.nickname),
      at: new Date().toISOString(),
      adminName: admin.name,
      reason,
      memo,
    })
  }, 700)
}

// Newest first.
export function getWithdrawals() {
  return handle(() => withdrawals)
}
