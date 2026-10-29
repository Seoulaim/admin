import { Link, useLocation } from 'react-router'
import { buttonClass } from '../../components/buttonClass.js'
import PageHeader from '../../components/PageHeader.jsx'

// 장소 관리 header with its 장소 / 키워드 tabs.
function PlacesLayout({ children }) {
  const { pathname } = useLocation()
  const onKeywords = pathname.startsWith('/places/keywords')
  const tabs = [
    { to: '/places', label: '장소', active: !onKeywords },
    { to: '/places/keywords', label: '키워드 (HC05)', active: onKeywords },
  ]

  return (
    <>
      <PageHeader title="장소 관리">
        <Link to="/places/new" className={buttonClass('primary')}>
          새 장소 추가
        </Link>
      </PageHeader>
      <nav className="flex gap-1 px-4 pt-4 sm:px-6 lg:px-8">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            aria-current={tab.active ? 'page' : undefined}
            className={`h-9 rounded-full px-4 text-sm leading-9 font-semibold ${tab.active ? 'bg-point-soft text-point-strong' : 'text-muted hover:bg-chip'}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </>
  )
}

export default PlacesLayout
