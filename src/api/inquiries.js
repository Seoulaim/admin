import { ApiError } from '../lib/apiClient.js'
import { inquiryErrorCode, inquiryFromApi } from './adapters/inquiry.js'
import { request } from './client.js'

// Help Center inquiries (MR03) other than refunds — those are handled in
// 환불 관리 (api/refunds.js).
// Inquiry: { id, author: { id, nickname, email }, language, category, title,
//   content, photoUrls, createdAt, status, answers, memo }
// - language: the app language the member wrote in, to answer in.
// - status: 'received' | 'answered'.
// - answers: [{ id, body, sentAt, adminName }] — each was emailed to the
//   member (the backend sends it; mail is the only channel, no push).
// - memo: an admin-only note, never sent.

// 백엔드: /api/v1/admin/inquiries (domain/inquiry/admin, docs/inquiry-flow.md).
// 형태 변환은 adapters/inquiry.js.

async function call(path, options) {
  try {
    return await request(path, options)
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(inquiryErrorCode(error.code), {
        status: error.status,
        details: error.details,
      })
    }
    throw error
  }
}

// Newest first, with refundCount: refund inquiries waiting in 환불 관리.
export async function getInquiries() {
  const data = await call('/api/v1/admin/inquiries')
  return {
    inquiries: (data?.inquiries ?? []).map(inquiryFromApi),
    refundCount: Number(data?.refundCount ?? 0),
  }
}

// Rejects with 'NOT_FOUND'.
export async function getInquiry(id) {
  return inquiryFromApi(await call(`/api/v1/admin/inquiries/${id}`))
}

// Emails `body` to the member and marks the inquiry answered. Resolves with
// the updated inquiry.
export async function answerInquiry(id, body) {
  return inquiryFromApi(
    await call(`/api/v1/admin/inquiries/${id}/answers`, {
      method: 'POST',
      body: { body },
    }),
  )
}

// Resolves with the updated inquiry (the mock resolved with nothing; the
// screen doesn't use it).
export async function saveInquiryMemo(id, memo) {
  return inquiryFromApi(
    await call(`/api/v1/admin/inquiries/${id}/memo`, {
      method: 'PUT',
      body: { memo },
    }),
  )
}
