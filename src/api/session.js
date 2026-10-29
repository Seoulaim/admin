import { admin } from '../mocks/db.js'
import { respond } from '../mocks/server.js'

// The logged-in operator: { name, email }. Login isn't decided yet
// (accounts, roles); the mock is always logged in.
export function getAdminSession() {
  return respond(admin)
}
