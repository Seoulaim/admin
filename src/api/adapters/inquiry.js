import { imageUrlFromKey } from './image.js'

// 백엔드 어드민 문의 DTO (domain/inquiry/admin, docs/inquiry-flow.md) →
// 화면 형태 (api/inquiries.js 참고). 백엔드가 이미 mock 형태로 주므로 얇다.
//
// - photoKeys (S3 key) → photoUrls (VITE_IMAGE_BASE_URL + '/' + key).
// - category·status 는 백엔드도 소문자라 그대로.
// - memo: 백엔드는 비우면 null → 화면은 문자열을 기대해 ''.
// - author: 탈퇴 회원은 email null, 프로필 조회 실패면 nickname 도 null →
//   화면 문구에 'null' 이 찍히지 않게 대신 표시할 글자를 채운다.

export function authorFromApi(raw) {
  return {
    id: raw?.id ?? null,
    nickname: raw?.nickname ?? '(알 수 없음)',
    email: raw?.email ?? '(이메일 없음 · 탈퇴 회원)',
  }
}

export const photoUrlsFromKeys = (keys) =>
  (keys ?? []).map(imageUrlFromKey).filter(Boolean)

export function inquiryFromApi(raw) {
  return {
    id: raw.id,
    author: authorFromApi(raw.author),
    language: raw.language ?? 'en',
    category: raw.category,
    title: raw.title ?? '',
    content: raw.content ?? '',
    photoUrls: photoUrlsFromKeys(raw.photoKeys),
    createdAt: raw.createdAt,
    status: raw.status,
    answers: (raw.answers ?? []).map((a) => ({
      id: a.id,
      body: a.body,
      sentAt: a.sentAt,
      adminName: a.adminName,
    })),
    memo: raw.memo ?? '',
  }
}

const ERROR_CODES = {
  INQUIRY_NOT_FOUND: 'NOT_FOUND',
  INQUIRY_POLICY_EXCEPTION_REQUIRED: 'POLICY_EXCEPTION_REQUIRED',
  INQUIRY_ALREADY_DECIDED: 'ALREADY_DECIDED',
  PAYMENT_REFUND_FAILED: 'REFUND_FAILED',
}

// 백엔드 에러 코드 → 화면이 분기하는 코드. 나머지는 그대로.
export function inquiryErrorCode(code) {
  return ERROR_CODES[code] ?? code
}
