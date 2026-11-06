import { ApiError as ApiError } from '../lib/apiClient.js'
import { withdrawalReasonLabel } from '../lib/members.js'
import { withdrawals } from '../mocks/members.js'
import { handle } from '../mocks/server.js'
import { memberFromApi, memberPageFromApi } from './adapters/member.js'
import { request } from './client.js'

// 회원 관리. The list hides the email partly (emailMasked from the server);
// the detail has it in full.
//
// List row: { id, nickname, maskedEmail (null once withdrawn), language,
//   joinedAt, diaryCount, paidCount, status: 'active' | 'suspended' |
//   'withdrawn' } (+ maskedName, lastSeenAt, biasGroupIds, marketing: not
//   on the server — null / [])
// Detail: { id, nickname, email, profileImageUrl, language, joinedAt,
//   status, withdrawnAt, withdrawnBy ('admin' | 'self'), withdrawReason,
//   biases: [{ id, name, group }], diaries, payments, inquiries,
//   consents, notifications, stats: { refundedCount, rejectedRefundCount,
//   pendingInquiryCount }, history } (+ name, lastSeenAt, plan, survey,
//   views: not on the server — null / [])
// Withdrawing (강퇴) does what the member's own withdrawal does: biases,
// saved places and plans are deleted, diaries soft-deleted, payment records
// kept (전자상거래법: 5 years), email cleared, sessions revoked.
//
// 백엔드: /api/v1/admin/users (docs/admin-ops.md 2절). 형태 변환은
// adapters/member.js. 강퇴 기록 목록(getWithdrawals)은 백엔드에 없어 mock.

const BASE = '/api/v1/admin/users'
export const PAGE_SIZE = 50
const RECENT_PAYMENT_MS = 7 * 864e5

const ERROR_CODES = {
  USER_NOT_FOUND: 'NOT_FOUND',
  USER_ALREADY_WITHDRAWN: 'ALREADY_WITHDRAWN',
}

async function call(path, options) {
  try {
    return await request(path, options)
  } catch (error) {
    if (error instanceof ApiError && ERROR_CODES[error.code]) {
      throw new ApiError(ERROR_CODES[error.code], {
        status: error.status,
        details: error.details,
      })
    }
    throw error
  }
}

// Newest sign-up first. filters: { q (email·nickname), status ('all' |
// 'active' | 'suspended' | 'withdrawn'), page (0-based), size }.
// → { items, page, size, totalElements }
export async function getMembers({
  q = '',
  status = 'all',
  page = 0,
  size = PAGE_SIZE,
} = {}) {
  const params = new URLSearchParams()
  if (q.trim()) params.set('q', q.trim())
  if (status && status !== 'all') params.set('status', status)
  params.set('page', String(page))
  params.set('size', String(size))
  return memberPageFromApi(await call(`${BASE}?${params}`))
}

// Rejects with 'NOT_FOUND'.
export async function getMember(id) {
  return memberFromApi(await call(`${BASE}/${id}`))
}

// Things to settle before withdrawing: { pendingRefunds, recentPayments }
// — refund requests still waiting, and payments within the refund period
// (worked out from the detail; the server has no endpoint for it).
export async function getWithdrawalChecks(id) {
  const member = await getMember(id)
  const since = Date.now() - RECENT_PAYMENT_MS
  return {
    pendingRefunds: member.inquiries.filter(
      (i) => i.refund?.status === 'requested',
    ).length,
    recentPayments: member.payments.filter(
      (p) => p.status === 'paid' && p.paidAt && new Date(p.paidAt) > since,
    ).length,
  }
}

// The server takes one reason of 1–200 characters.
export const WITHDRAW_REASON_MAX = 200

export function withdrawReasonText(reason, memo) {
  return `${withdrawalReasonLabel(reason)} — ${memo.trim()}`.slice(
    0,
    WITHDRAW_REASON_MAX,
  )
}

// 강퇴. reason: one of WITHDRAWAL_REASONS' ids; memo: what happened
// (required) — sent together as one reason. No mail goes to the member yet
// (백엔드 미구현). Rejects with 'ALREADY_WITHDRAWN' or 'NOT_FOUND'.
export async function withdrawMember(id, reason, memo) {
  await call(`${BASE}/${id}/withdraw`, {
    method: 'POST',
    body: { reason: withdrawReasonText(reason, memo) },
  })
}

// Newest first.
export function getWithdrawals() {
  return handle(() => withdrawals)
}
