// A link an admin types for the member app to open.
export const isHttpUrl = (value) => /^https?:\/\/\S+\.\S+/.test(value.trim())

// Message when a period isn't filled in right, or null.
export function periodError({ startDate, endDate }) {
  if (!startDate || !endDate) return '시작일과 종료일을 입력해 주세요.'
  if (endDate < startDate) return '종료일이 시작일보다 빨라요.'
  return null
}
