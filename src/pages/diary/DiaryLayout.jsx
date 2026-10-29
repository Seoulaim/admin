import { Link, useLocation } from 'react-router'
import PageHeader from '../../components/PageHeader.jsx'

const TABS = [
  { to: '/diary/templates', label: '템플릿' },
  { to: '/diary/stickers', label: '스티커' },
  { to: '/diary/fonts', label: '폰트' },
]

// 다이어리 관리 header with its tabs; actions: the header's right side.
function DiaryLayout({ title = '다이어리 관리', actions, children }) {
  const { pathname } = useLocation()

  return (
    <>
      <PageHeader title={title}>{actions}</PageHeader>
      <nav className="flex gap-1 px-4 pt-4 sm:px-6 lg:px-8">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.to)
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

export default DiaryLayout
