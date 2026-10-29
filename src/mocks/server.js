import { ApiError } from '../lib/apiClient.js'

// Stand-in for the backend until the admin API exists: api/ functions call
// respond() / handle() here, and only their insides change later.

const DELAY_MS = 200

// The real client's error class, so mock and real failures look the same.
export { ApiError }

export function respond(data, delayMs = DELAY_MS) {
  return handle(() => data, delayMs)
}

// Runs `action` like a request: resolves with a copy of its result or
// rejects with its error.
export function handle(action, delayMs = DELAY_MS) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(structuredClone(action()))
      } catch (error) {
        reject(error)
      }
    }, delayMs)
  })
}
