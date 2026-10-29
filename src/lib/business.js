// Who mail comes from, and the business details the marketing mail footer
// must show (정보통신망법: sender's name and contact). Same details as the
// member app footer (Seoulaim_web src/components/BusinessInfo.jsx) — change
// both together. The backend actually sends the mail; this is what the
// preview shows.
export const MAIL_SENDER = {
  name: 'Seoulaim',
  // The address mail is sent from. A Gmail address works for replies, but
  // sending many mails "from" it through a mail service gets them marked
  // as spam — see the note in api/mail.js.
  email: 'seoulaimkr@gmail.com',
}

export const BUSINESS = {
  name: '설레임(Seoulaim)',
  ceo: '김민서',
  businessNumber: '118-10-73249',
  address: '서울특별시 서대문구 신촌로 127, 지하2층 201-107호',
  phone: '010-7457-3469',
  email: 'seoulaimkr@gmail.com',
}
