// What the admin can send from 공지 관리.
export const MAIL_KINDS = {
  marketing: {
    label: '홍보 메일',
    tone: 'bg-point-soft text-point-strong',
    hint: '이벤트·새 기능 소개 같은 광고성 메일. 마케팅 수신에 동의한 회원에게만 가요. 제목 앞 (광고), 발신자 정보, 수신 거부 링크가 자동으로 붙고, 밤 9시~아침 8시에는 보낼 수 없어요.',
  },
  notice: {
    label: '서비스 공지',
    tone: 'bg-info-soft text-info',
    hint: '약관·개인정보처리방침 변경, 점검처럼 꼭 알려야 하는 안내. 수신 설정과 관계없이 가요. 광고 내용을 넣으면 안 돼요.',
  },
}

export const CAMPAIGN_STATUS = {
  draft: { label: '임시저장', tone: 'bg-chip text-muted' },
  scheduled: { label: '예약', tone: 'bg-warn-soft text-warn' },
  sent: { label: '발송됨', tone: 'bg-ok-soft text-ok' },
  canceled: { label: '예약 취소', tone: 'bg-chip text-sub' },
}
