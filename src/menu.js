// Sidebar menu, grouped like the Figma admin frame. Each item is also a
// route (router.jsx).
export const MENU = [
  {
    title: '개요',
    items: [
      { path: '/', label: '대시보드' },
      { path: '/survey', label: '만족도 조사' },
    ],
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
      { path: '/payments', label: '결제 관리' },
      { path: '/refunds', label: '환불 관리' },
    ],
  },
  {
    title: '고객',
    items: [
      { path: '/inquiries', label: '문의 관리' },
      { path: '/members', label: '회원 관리' },
      { path: '/mail', label: '공지 관리' },
    ],
  },
]
