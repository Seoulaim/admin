import { Link } from 'react-router'
import Card from '../../components/Card.jsx'
import Chip from '../../components/Chip.jsx'
import { formatDateTime } from '../../lib/dates.js'
import { formatKrw } from '../../lib/money.js'
import { PAYMENT_STATUS } from './paymentStatus.js'

function Rows({ rows }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-sub">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

// One payment: what was paid, by whom, for which diary.
function PaymentDetail({ payment }) {
  const status = PAYMENT_STATUS[payment.status]
  const { diary } = payment

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={status.tone}>{status.label}</Chip>
          {payment.sameDiaryPayments > 0 && (
            <Chip tone="bg-danger/10 text-danger">
              같은 다이어리 결제 {payment.sameDiaryPayments + 1}건 · 중복 의심
            </Chip>
          )}
          <span className="ml-auto text-xs text-sub tabular-nums">
            {formatDateTime(payment.paidAt)}
          </span>
        </div>
        <p className="text-2xl font-bold tabular-nums">
          {formatKrw(payment.amount)}
        </p>
        <Rows
          rows={[
            ['주문번호', payment.orderId],
            [
              '결제 수단',
              payment.provider === 'toss' ? '토스페이먼츠' : payment.provider,
            ],
            ['환불 제한 동의', formatDateTime(payment.refundConsentAt)],
            [
              '결제 후 편집',
              payment.editedAt ? formatDateTime(payment.editedAt) : '없음',
            ],
            [
              '회원',
              <Link
                key="member"
                to={`/members/${payment.member.id}`}
                className="font-semibold text-point-strong underline underline-offset-2"
              >
                {payment.member.nickname} ({payment.member.id})
              </Link>,
            ],
            ['이메일', payment.member.email],
          ]}
        />
        {payment.refundRequestId && (
          <Link
            to={`/refunds/${payment.refundRequestId}`}
            className="self-start text-sm font-semibold text-point-strong underline underline-offset-2"
          >
            환불 요청 보기 →
          </Link>
        )}
      </Card>

      <Card className="flex flex-col gap-3 p-5 sm:p-6">
        <h3 className="text-sm font-bold">다이어리</h3>
        <Rows
          rows={[
            ['이름', diary.name ?? '(삭제됨)'],
            [
              '종류',
              diary.first ? '첫 다이어리 (3쪽부터 결제)' : '추가 다이어리',
            ],
            ['페이지', `${diary.pages}쪽`],
            [
              '완성(Done)',
              diary.completedAt ? formatDateTime(diary.completedAt) : '편집 중',
            ],
          ]}
        />
      </Card>
    </div>
  )
}

export default PaymentDetail
