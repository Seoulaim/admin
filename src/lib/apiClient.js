// Every request to the admin API goes through apiRequest, the same contract
// as the member app's (Seoulaim_web src/lib/apiClient.js): it prefixes
// VITE_API_URL and turns any failure into an ApiError whose `code` the
// screens check (the same codes the mock throws).
//
// Differences from the member app:
// - Admin text comes back as the full { en, ko, zh, ja } objects (never
//   localized): the admin edits every language.
// - Logging in sets an httpOnly session cookie (one shared operator
//   account), so requests send cookies; the backend allows this origin
//   with credentials in CORS.
// A failed response's JSON body is { code, message?, details? }; without a
// code, the HTTP status decides.

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(code, { status = null, details = null } = {}) {
    super(code)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

const STATUS_CODES = {
  400: 'BAD_REQUEST',
  401: 'LOGIN_REQUIRED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
}

export const NETWORK_ERROR = 'NETWORK_ERROR'
// Dispatched on window when the session has expired (401), so the layout
// can send the operator to log in again.
export const LOGIN_REQUIRED_EVENT = 'admin:login-required'
export const SERVER_ERROR = 'SERVER_ERROR'

// body: a plain object (sent as JSON) or FormData (file uploads).
// query: { key: value }; null / undefined / '' values are left out.
// Resolves with the parsed JSON body (null when there is none).
export async function apiRequest(
  path,
  { method = 'GET', query, body, signal } = {},
) {
  const url = new URL(BASE_URL + path, window.location.origin)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value != null && value !== '') url.searchParams.set(key, value)
  }
  const isForm = body instanceof FormData

  let response
  try {
    response = await fetch(url, {
      method,
      signal,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !isForm
          ? { 'Content-Type': 'application/json' }
          : {}),
      },
      body: body === undefined || isForm ? body : JSON.stringify(body),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError(NETWORK_ERROR)
  }

  const data = await readJson(response)
  if (response.ok) return data
  const code =
    data?.code ??
    STATUS_CODES[response.status] ??
    (response.status >= 500 ? SERVER_ERROR : `HTTP_${response.status}`)
  if (code === 'LOGIN_REQUIRED') {
    window.dispatchEvent(new Event(LOGIN_REQUIRED_EVENT))
  }
  throw new ApiError(code, {
    status: response.status,
    details: data?.details ?? null,
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
