import { ApiError } from '../lib/apiClient.js'
import { clearAdminKey, getAdminKey, request, setAdminKey } from './client.js'

// 임시 어드민 인증: 백엔드는 /api/v1/admin/** 에 X-Admin-Key 헤더만 본다
// (서버 세션·쿠키 없음). 로그인 화면의 비밀번호 칸 값을 키로 쓰고, ID 칸은
// 쓰지 않는다. 키는 sessionStorage (client.js) 에 둔다.
//   getAdminSession() → { loggedIn, name, email }
//   login({ id, password }) → 같은 형태; 틀린 키는 'INVALID_CREDENTIALS'
//   logout()

const session = () =>
  getAdminKey()
    ? { loggedIn: true, name: '운영자', email: '' }
    : { loggedIn: false, name: null, email: null }

export async function getAdminSession() {
  return session()
}

// 키를 저장한 뒤 GET /api/v1/admin/diary-templates 가 2xx 인지로 검증한다.
export async function login({ password }) {
  if (!password) throw new ApiError('INVALID_CREDENTIALS')
  setAdminKey(password)
  try {
    await request('/api/v1/admin/diary-templates')
  } catch (error) {
    clearAdminKey()
    if (error.status === 401 || error.status === 403) {
      throw new ApiError('INVALID_CREDENTIALS', { status: error.status })
    }
    throw error // 네트워크·서버 오류는 그대로 (화면이 "잠시 뒤 다시" 안내)
  }
  return session()
}

export async function logout() {
  clearAdminKey()
}
