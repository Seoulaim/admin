import { Link, useLocation } from 'react-router'
import PageHeader from '../../components/PageHeader.jsx'

const TABS = [
  { to: '/mail', label: '메일 보내기', match: (p) => p === '/mail' },
  {
    to: '/mail/history',
    label: '발송 내역',
    match: (p) => p.startsWith('/mail/history'),
  },
  {
    to: '/mail/auto',
    label: '자동 메일',
    match: (p) => p.startsWith('/mail/auto'),
  },
]

// 공지 관리 header with its tabs.
function MailLayout({ children }) {
  const { pathname } = useLocation()

  return (
    <>
      <PageHeader title="공지 관리" />
      <nav className="flex gap-1 px-4 pt-4 sm:px-6 lg:px-8">
        {TABS.map((tab) => {
          const active = tab.match(pathname)
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              className={`h-9 rounded-full px-4 text-sm leading-9 font-semibold ${active ? 'bg-point-soft text-point-strong' : 'text-muted hover:bg-chip'}`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      {children}
    </>
  )
}

export default MailLayout
