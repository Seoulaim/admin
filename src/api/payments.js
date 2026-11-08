import { ApiError } from '../lib/apiClient.js'
import { paymentDetailFromApi, paymentPageFromApi } from './adapters/payment.js'
import { request } from './client.js'

// 결제 관리: every diary payment, newest first.
// Payment: { id, orderId, member: { id, nickname, email }, amount,
//   currency (KRW | USD; amount in its unit, USD 2.99), provider ('toss'),
//   method (CARD | PAYPAL), methodDetail (토스 결제수단, or null), methodLabel, createdAt,
//   paidAt (null before paying), refundedAt, refundConsentAt,
//   editedAt: first edit after paying (POST /diaries/{id}/edited), or null.
//     On a first diary only pages 3+ count: pages 1–2 are free to change,
//     before or after paying. Per payment: a first diary paid again after a
//     refund has two, and edits go on the unrefunded one, whose 7 days and
//     edit history start over,
//   diary: { id, name, first, pages, completedAt, deleted },
//   status: 'pending' | 'paid' | 'refund-requested' | 'failed' | 'refunded'
//     ('refund-requested' = paid with a refund request waiting),
//   refundRequested, refundRequestId: the latest refund inquiry, if any,
//   sameDiaryPayments: other paid payments of the same diary when this one
//     is paid too (more than zero hints at a duplicate charge) }
// Compare with the Toss Payments console by orderId.
//
// 백엔드: GET /api/v1/admin/payments, /{id} (docs/admin-ops.md 1절).
// 형태 변환은 adapters/payment.js.

const BASE = '/api/v1/admin/payments'
export const PAGE_SIZE = 50
const MAX_PAGE_SIZE = 200

const ERROR_CODES = { PAYMENT_NOT_FOUND: 'NOT_FOUND' }

async function call(path) {
  try {
    return await request(path)
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

function queryString({ status, q, from, to, page, size }) {
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (q?.trim()) params.set('q', q.trim())
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  params.set('page', String(page ?? 0))
  params.set('size', String(size ?? PAGE_SIZE))
  return params.toString()
}

// filters: { status ('all' | 'pending' | 'paid' | 'failed' | 'refunded'),
//   q (orderId·email·nickname), from, to (created date YYYY-MM-DD, Seoul),
//   page (0-based), size }.
// → { items, page, size, totalElements, summary: { paidCount, paidAmount,
//   refundedCount, refundedAmount (KRW), paidAmounts, refundedAmounts ({ KRW, USD }) } } — summary follows q/from/to but not
//   status.
export async function getPayments(filters = {}) {
  return paymentPageFromApi(await call(`${BASE}?${queryString(filters)}`))
}

// Every page for the filters (CSV 내보내기).
export async function getAllPayments(filters = {}) {
  const items = []
  for (let page = 0; ; page++) {
    const result = await getPayments({
      ...filters,
      page,
      size: MAX_PAGE_SIZE,
    })
    items.push(...result.items)
    if (result.items.length === 0 || items.length >= result.totalElements) {
      return items
    }
  }
}

// One payment plus Toss keys, failure reason and the latest refund request
// { inquiryId, status } | null. Rejects with 'NOT_FOUND'.
export async function getPayment(id) {
  return paymentDetailFromApi(await call(`${BASE}/${id}`))
}
