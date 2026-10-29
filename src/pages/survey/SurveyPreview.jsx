import { useState } from 'react'
import Card from '../../components/Card.jsx'
import { LANGUAGES } from '../../lib/languages.js'

// Button labels as the member app's translation files would have them
// (placeholders until the app adds them).
const BUTTONS = {
  en: { yes: 'Yes', snooze: "Don't show again today", submit: 'Submit' },
  ko: { yes: '예', snooze: '오늘 하루 보지 않기', submit: '제출' },
  zh: { yes: '好的', snooze: '今天不再显示', submit: '提交' },
  ja: { yes: 'はい', snooze: '今日は表示しない', submit: '送信' },
}

// The invite popup and the survey screen as the member app shows them, in
// a chosen language (empty languages fall back to English). Archived
// questions aren't shown.
function SurveyPreview({ invite, questions }) {
  const [language, setLanguage] = useState('en')
  const text = (value) => value?.[language] || value?.en || ''
  const live = questions.filter((q) => !q.archived)

  return (
    <Card className="flex flex-col gap-3 p-4 xl:sticky xl:top-20">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">팝업 미리보기</h2>
        <div className="flex gap-1">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={l.id === language}
              onClick={() => setLanguage(l.id)}
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${l.id === language ? 'bg-text text-white' : 'bg-chip text-muted'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs font-bold text-sub">1. TRAVEL 안내 팝업</p>
      <div className="mx-auto w-full max-w-[320px] rounded-2xl border border-border bg-white p-5 text-center shadow-card">
        <div
          className="-mt-1 mb-2 text-right text-xs text-sub"
          aria-hidden="true"
        >
          ✕
        </div>
        <p className="font-bold">{text(invite.title) || '제목'}</p>
        <p className="mt-2 text-sm whitespace-pre-line text-muted">
          {text(invite.body) || '내용'}
        </p>
        <span className="mt-4 block rounded-full bg-point py-2 text-sm font-semibold text-white">
          {BUTTONS[language].yes}
        </span>
        <span className="mt-2 block text-xs text-sub">
          {BUTTONS[language].snooze}
        </span>
      </div>
      <p className="mt-2 text-xs font-bold text-sub">
        2. &lsquo;예&rsquo;를 누르면: 설문 화면
      </p>
      <div className="mx-auto w-full max-w-[360px] rounded-2xl border border-border bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between text-xs text-sub">
          <span>Seoulaim</span>
          <span aria-hidden="true">✕</span>
        </div>
        <ol className="flex flex-col gap-5">
          {live.map((q) => (
            <li key={q.key ?? q.id} className="flex flex-col gap-2">
              <p className="text-sm font-semibold">
                {text(q.title) || '질문'}
                {q.required && (
                  <span className="ml-0.5 text-point-strong">*</span>
                )}
              </p>
              {q.type === 'rating' && (
                <p className="text-2xl tracking-widest text-line">★★★★★</p>
              )}
              {(q.type === 'single' || q.type === 'multiple') && (
                <ul className="flex flex-wrap gap-1.5">
                  {q.options.map((o, i) => (
                    <li
                      key={o.key ?? o.id ?? i}
                      className="rounded-full border border-border px-3 py-1 text-xs"
                    >
                      {text(o.label) || '보기'}
                    </li>
                  ))}
                </ul>
              )}
              {q.type === 'text' && (
                <div className="h-16 rounded-lg border border-border bg-panel" />
              )}
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-col gap-2">
          <span className="rounded-full bg-point py-2 text-center text-sm font-semibold text-white">
            {BUTTONS[language].submit}
          </span>
          <span className="text-center text-xs text-sub">
            {BUTTONS[language].snooze}
          </span>
        </div>
      </div>
      <p className="text-xs text-sub">
        버튼 문구는 앱의 번역 파일에서 정해져요(여기 문구는 예시). 실제 모양은
        앱 디자인을 따라요.
      </p>
    </Card>
  )
}

export default SurveyPreview
