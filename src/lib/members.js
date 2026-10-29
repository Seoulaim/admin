// Why an account was withdrawn by the admin (강퇴). The terms of service
// must list these as grounds (member app terms).
export const WITHDRAWAL_REASONS = [
  {
    id: 'abuse',
    label: '다른 회원·제3자의 권리 침해 (명예훼손, 사진 도용 등)',
  },
  { id: 'fraud', label: '부정 결제·부정 이용 (결제 도용, 환불 악용 등)' },
  { id: 'illegal', label: '불법·유해한 내용 게시' },
  { id: 'request', label: '회원 본인 요청 (직접 탈퇴하기 어려운 경우)' },
  { id: 'other', label: '기타 이용약관 위반' },
]

export const withdrawalReasonLabel = (id) =>
  WITHDRAWAL_REASONS.find((r) => r.id === id)?.label ?? id
