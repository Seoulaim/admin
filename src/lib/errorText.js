// 토스트에 붙일 에러 설명: 'CODE' 또는 'CODE: 필드1, 필드2'.
// error: ApiError (code, details = 백엔드 fields { 필드: 메시지 }) 또는 아무 값.
export function errorText(error) {
  const code = error?.code ?? 'UNKNOWN_ERROR'
  const details = error?.details
  const fields =
    details && typeof details === 'object' && !Array.isArray(details)
      ? Object.keys(details)
      : []
  return fields.length > 0 ? `${code}: ${fields.join(', ')}` : code
}
