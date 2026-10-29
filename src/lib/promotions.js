import { todayKey } from './dates.js'

// Where a promotion shows in the member app.
export const PLACEMENTS = [
  { id: 'HOME', label: 'HOME', screen: '홈(HH01) 메인 배너' },
  { id: 'DIARY', label: 'DIARY', screen: '다이어리(DD01) 배너' },
]

export const TARGET_TYPES = [
  { id: 'DIARY', label: '다이어리 탭' },
  { id: 'URL', label: '외부 링크' },
]

// Banner image ratio in the member app (HH01 and DD01 alike).
export const BANNER_WIDTH = 393
export const BANNER_HEIGHT = 197

// The posting state next to the switch. Periods follow Korean time and
// include the end date (through 23:59).
export function promotionStatus(promotion, today = todayKey()) {
  if (promotion.isDefault) return 'always'
  if (promotion.endDate < today) return 'ended'
  if (!promotion.enabled) return 'off'
  if (promotion.startDate > today) return 'scheduled'
  return 'live'
}

export const STATUS_LABELS = {
  always: '상시 게시',
  live: '게시 중',
  scheduled: '예약',
  off: '꺼짐',
  ended: '종료',
}
