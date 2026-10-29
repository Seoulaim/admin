import { Link } from 'react-router'
import { getDashboard } from '../../api/dashboard.js'
import LoadError from '../../components/LoadError.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { formatKrw } from '../../lib/money.js'
import DailyChart from './DailyChart.jsx'
import PendingInquiries from './PendingInquiries.jsx'
import PendingRefunds from './PendingRefunds.jsx'
import StatCard from './StatCard.jsx'

// Signups, payments, and what's waiting for the admin (inquiries, refunds).
function DashboardPage() {
  const { data, error, reload } = useFetch(getDashboard)

  return (
    <>
      <PageHeader title="대시보드" />
      <main className="p-4 sm:p-6 lg:p-8">
        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : !data ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : (
          <Dashboard data={data} />
        )}
      </main>
    </>
  )
}

function Dashboard({ data }) {
  const { signups, payments } = data
  const signupDiff = signups.today - signups.yesterday

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6 xl:grid-cols-5">
        <StatCard
          label="오늘 신규 가입자"
          value={`${signups.today}명`}
          note={`어제보다 ${signupDiff >= 0 ? '+' : ''}${signupDiff}명`}
        />
        <StatCard
          label="이번 달 결제"
          value={`${payments.thisMonth.paymentCount}건`}
          note={`${formatKrw(payments.thisMonth.revenue)} · 지난달 ${payments.lastMonth.paymentCount}건`}
        />
        <StatCard
          label="답변 대기 문의"
          value={`${data.pendingInquiries.length}건`}
          note={<Link to="/inquiries">문의 관리로 →</Link>}
          highlight={data.pendingInquiries.length > 0}
        />
        <StatCard
          label="처리 대기 환불"
          value={`${data.pendingRefunds.length}건`}
          note={<Link to="/refunds">환불 관리로 →</Link>}
          highlight={data.pendingRefunds.length > 0}
        />
        <StatCard
          label="플랜 만족도"
          value={
            data.survey.averageRating == null
              ? '-'
              : `${data.survey.averageRating.toFixed(1)} / 5`
          }
          note={
            <Link to="/survey">
              이번 주 응답 {data.survey.responsesThisWeek}건 →
            </Link>
          }
        />
      </div>

      <DailyChart daily={data.daily} />

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-2">
        <PendingInquiries inquiries={data.pendingInquiries} />
        <PendingRefunds refunds={data.pendingRefunds} />
      </div>
    </div>
  )
}

export default DashboardPage
