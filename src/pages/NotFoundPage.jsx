import { Link } from 'react-router'
import PageHeader from '../components/PageHeader.jsx'

function NotFoundPage() {
  return (
    <>
      <PageHeader title="페이지를 찾을 수 없어요" />
      <main className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-sm text-sub">주소가 바뀌었거나 없는 화면이에요.</p>
        <Link
          to="/"
          className="rounded-full border border-point px-4 py-1.5 text-sm font-semibold text-point-strong"
        >
          대시보드로
        </Link>
      </main>
    </>
  )
}

export default NotFoundPage
