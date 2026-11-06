// 백엔드 결제 상태 + 'refund-requested' (paid 이면서 환불 요청 대기 중,
// 표시 전용 — 필터는 백엔드 상태 기준).
export const PAYMENT_STATUS = {
  pending: { label: '결제 대기', tone: 'bg-chip text-muted' },
  paid: { label: '결제 완료', tone: 'bg-ok-soft text-ok' },
  'refund-requested': { label: '환불 요청', tone: 'bg-warn-soft text-warn' },
  failed: { label: '실패', tone: 'bg-danger/10 text-danger' },
  refunded: { label: '환불됨', tone: 'bg-chip text-muted' },
}

// 상태 필터 (GET /admin/payments?status=). '결제 완료'는 환불 요청 중인
// 결제도 포함한다.
export const PAYMENT_STATUS_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'paid', label: '결제 완료' },
  { id: 'pending', label: '결제 대기' },
  { id: 'failed', label: '실패' },
  { id: 'refunded', label: '환불됨' },
]
