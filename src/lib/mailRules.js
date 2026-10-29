// Marketing mail can't go out between 21:00 and 08:00 Seoul time without
// a separate night-time consent (정보통신망법 제50조), which we don't ask
// for. The screen checks it to warn early; the backend enforces it.
export const NIGHT_START = 21
export const NIGHT_END = 8

const seoulHour = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  hourCycle: 'h23',
})

// Whether an ISO time falls in the night window (Seoul).
export function isNight(iso) {
  const hour = Number(seoulHour.format(new Date(iso)))
  return hour >= NIGHT_START || hour < NIGHT_END
}
