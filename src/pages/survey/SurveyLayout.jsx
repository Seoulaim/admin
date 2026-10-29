import { Link, useLocation } from 'react-router'
import { getSurvey, setSurveyEnabled } from '../../api/survey.js'
import PageHeader from '../../components/PageHeader.jsx'
import Switch from '../../components/Switch.jsx'
import { useFetch } from '../../hooks/useFetch.js'

const TABS = [
  { to: '/survey', label: '결과', match: (p) => p === '/survey' },
  {
    to: '/survey/questions',
    label: '질문 편집',
    match: (p) => p.startsWith('/survey/questions'),
  },
]

// 만족도 조사 header: the popup's on / off switch, and the tabs.
function SurveyLayout({ children }) {
  const { pathname } = useLocation()
  const { data: survey, update } = useFetch(getSurvey)

  async function toggle(enabled) {
    update((s) => ({ ...s, enabled }))
    try {
      await setSurveyEnabled(enabled)
    } catch {
      update((s) => ({ ...s, enabled: !enabled }))
    }
  }

  return (
    <>
      <PageHeader title="만족도 조사">
        {survey && (
          <label className="flex items-center gap-2 text-sm font-semibold text-muted">
            <span className={survey.enabled ? 'text-ok' : 'text-sub'}>
              {survey.enabled ? '팝업 켜짐' : '팝업 꺼짐'}
            </span>
            <Switch
              checked={survey.enabled}
              onChange={toggle}
              label="앱에 만족도 조사 팝업 띄우기"
            />
          </label>
        )}
      </PageHeader>
      {survey && !survey.enabled && (
        <p className="mx-4 mt-4 rounded-xl bg-warn-soft px-4 py-2.5 text-sm text-warn sm:mx-6 lg:mx-8">
          팝업이 꺼져 있어서 앱에서 만족도 조사가 뜨지 않아요. 받은 응답과
          결과는 그대로예요.
        </p>
      )}
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

export default SurveyLayout
