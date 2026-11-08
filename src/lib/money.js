// Amounts are numbers in the payment's currency: KRW whole won (3000),
// USD dollars with cents (2.99). Mock data has no currency → KRW.
export const formatKrw = (amount) => `₩${amount.toLocaleString('ko-KR')}`

const CURRENCY_FORMAT = {
  KRW: (n) => formatKrw(Math.round(n)),
  USD: (n) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
}

// formatMoney(3000, 'KRW') → '₩3,000', formatMoney(2.99, 'USD') → '$2.99'.
export function formatMoney(amount, currency = 'KRW') {
  const n = Number(amount ?? 0)
  const format = CURRENCY_FORMAT[currency ?? 'KRW']
  return format ? format(n) : `${n.toLocaleString('ko-KR')} ${currency}`
}

// Per-currency totals { KRW: 12000, USD: 5.98 } → '₩12,000 · $5.98'
// (currencies with nothing left out; all empty → '₩0').
export function formatAmounts(amounts) {
  const parts = Object.entries(amounts ?? {})
    .filter(([, amount]) => Number(amount) !== 0)
    .map(([currency, amount]) => formatMoney(amount, currency))
  return parts.length > 0 ? parts.join(' · ') : formatKrw(0)
}

const METHOD_LABELS = { CARD: '카드', PAYPAL: 'PayPal' }

// method CARD | PAYPAL (+ Toss's own method string, e.g. '해외간편결제(PAYPAL)')
// → '카드' / 'PayPal (해외간편결제(PAYPAL))'. null when neither is known.
export function paymentMethodLabel(method, methodDetail) {
  const key = method ? String(method).toUpperCase() : null
  const label = key ? (METHOD_LABELS[key] ?? key) : null
  if (!label) return methodDetail || null
  return methodDetail && methodDetail !== label
    ? `${label} (${methodDetail})`
    : label
}
