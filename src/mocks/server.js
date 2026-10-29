// Stand-in for the backend until the admin API exists: api/ functions call
// respond() / handle() here, and only their insides change later.

const DELAY_MS = 200

// Same shape as the member app's ApiError: screens branch on error.code.
export class ApiError extends Error {
  constructor(code, message, details) {
    super(message || code)
    this.code = code
    this.details = details ?? null
  }
}

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
