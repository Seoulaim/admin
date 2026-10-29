// Sidebar menu, grouped like the Figma admin frame. Each item is also a route
// (router.jsx); `plan` lists what the screen will do until it's built.
export const MENU = [
  {
    title: '개요',
    items: [{ path: '/', label: '대시보드' }],
  },
  {
    title: '콘텐츠',
    items: [
      { path: '/promotions', label: '프로모션 관리' },
      { path: '/events', label: '이벤트 관리' },
      { path: '/artists', label: '그룹·멤버 관리' },
      { path: '/places', label: '장소 관리' },
      { path: '/diary', label: '다이어리 관리' },
    ],
  },
  {
    title: '결제',
    items: [
      {
        path: '/payments',
        label: '결제 관리',
        plan: [
          '결제 내역: 회원, 다이어리, 금액, 결제일, 환불 동의 시각',
          '토스페이먼츠 주문번호로 대조',
        ],
      },
      {
        path: '/refunds',
        label: '환불 관리',
        plan: [
          '환불 문의(Help Center) 목록과 대상 결제',
          '환불 조건 확인: 결제 후 7일 이내, 다이어리 완성 전',
          '환불 처리와 결과 메일',
        ],
      },
    ],
  },
  {
    title: '고객',
    items: [
      {
        path: '/inquiries',
        label: '문의 관리',
        plan: [
          '유형별 목록·필터 (환불, 결제, 다이어리·PDF, 계정, 신고, 기타)',
          '문의 내용과 사진 확인',
          '답변 작성 → 회원 이메일로 발송',
        ],
      },
      {
        path: '/members',
        label: '회원 관리',
        plan: [
          '회원 검색·목록 (개인정보는 가려서 표시)',
          '프로필, 가입 동의 이력, 이메일 수신 설정',
          '탈퇴 처리',
        ],
      },
      {
        path: '/mail',
        label: '공지 관리',
        plan: [
          '마케팅 메일 작성·예약·발송 (수신 동의 회원만)',
          '(광고) 표기, 수신 거부 링크, 야간 발송 제한',
          '자동 메일 템플릿과 발송 이력',
        ],
      },
    ],
  },
]

export const MENU_ITEMS = MENU.flatMap((group) => group.items)
