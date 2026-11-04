import {
  ApiError,
  LOGIN_REQUIRED_EVENT,
  NETWORK_ERROR,
} from '../lib/apiClient.js'

// Seoulaim backend (Spring Boot) 호출용 fetch 래퍼.
// - VITE_API_BASE_URL 기준, 경로는 '/api/v1/...'.
// - 어드민 인증은 쿠키가 아니라 X-Admin-Key 헤더 (credentials: 'omit').
//   키는 sessionStorage 에 두므로 탭을 닫으면 로그아웃된다.
// - 실패 응답 { code, message, fields, traceId } 는 lib/apiClient.js 의
//   ApiError(code) 로 바꿔 reject 한다. 화면은 error.code 로 분기.
// - 401/403 (틀린 키·키 없음 → 403 AUTH_ACCESS_DENIED) 이면 키를 지우고
//   LOGIN_REQUIRED_EVENT 를 보내 AdminLayout 이 /login 으로 보낸다.
// - admin: false — 어드민이 아닌 공개 API (예: GET /api/v1/keywords).
//   X-Admin-Key 를 붙이지 않고, 401/403 이어도 로그아웃시키지 않는다.

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(
  /\/+$/,
  '',
)

const ADMIN_KEY_STORAGE = 'seoulaim.adminKey'

export function getAdminKey() {
  try {
    return sessionStorage.getItem(ADMIN_KEY_STORAGE)
  } catch {
    return null
  }
}

export function setAdminKey(key) {
  try {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, key)
  } catch {
    // 저장소를 못 쓰는 환경: 다음 요청에서 키 없음(403)으로 처리된다.
  }
}

export function clearAdminKey() {
  try {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE)
  } catch {
    // 무시
  }
}

const STATUS_CODES = {
  400: 'BAD_REQUEST',
  401: 'LOGIN_REQUIRED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
}

// body: JSON 으로 보낼 객체. Resolves with the parsed JSON (null when empty).
export async function request(
  path,
  { method = 'GET', body, signal, admin = true } = {},
) {
  const key = admin ? getAdminKey() : null
  let response
  try {
    response = await fetch(API_BASE_URL + path, {
      method,
      signal,
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        ...(key ? { 'X-Admin-Key': key } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError(NETWORK_ERROR)
  }

  const data = await readJson(response)
  if (response.ok) return data

  if (admin && (response.status === 401 || response.status === 403)) {
    clearAdminKey()
    window.dispatchEvent(new Event(LOGIN_REQUIRED_EVENT))
  }
  const code =
    data?.code ??
    STATUS_CODES[response.status] ??
    (response.status >= 500 ? 'SERVER_ERROR' : `HTTP_${response.status}`)
  throw new ApiError(code, {
    status: response.status,
    details: data?.fields ?? null,
  })
}

async function readJson(response) {
  const text = await response.text().catch(() => '')
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
