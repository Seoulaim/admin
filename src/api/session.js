import { admin } from '../mocks/db.js'
import { ApiError, handle } from '../mocks/server.js'

// One shared operator account. The backend checks the ID / password and
// sets an httpOnly session cookie; nothing about the password lives here.
//   GET  /admin/session → { loggedIn, name, email }  (200 even when logged out)
//   POST /admin/login { id, password } → same; 'INVALID_CREDENTIALS'
//   POST /admin/logout
// The mock starts logged in and accepts any ID / password.
let loggedIn = true

const session = () => ({
  loggedIn,
  name: loggedIn ? admin.name : null,
  email: loggedIn ? admin.email : null,
})

export function getAdminSession() {
  return handle(session)
}

export function login({ id, password }) {
  return handle(() => {
    if (!id.trim() || !password) throw new ApiError('INVALID_CREDENTIALS')
    loggedIn = true
    return session()
  }, 500)
}

export function logout() {
  return handle(() => {
    loggedIn = false
  })
}
