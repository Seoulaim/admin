import { useState } from 'react'
import Card from '../../components/Card.jsx'
import { BUSINESS, MAIL_SENDER } from '../../lib/business.js'
import { LANGUAGES } from '../../lib/languages.js'

// The mail as a member in `language` gets it, with what the backend adds:
// "(광고)" and the legal footer for marketing, a note for notices.
function MailPreview({ kind, subject, body, byLanguage }) {
  const [language, setLanguage] = useState('en')
  const text = (value) => value[language] || value.en || ''
  const marketing = kind === 'marketing'

  return (
    <Card className="flex flex-col gap-3 p-4 xl:sticky xl:top-20">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">미리보기</h2>
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
              {byLanguage?.[l.id] ? ` ${byLanguage[l.id]}` : ''}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border bg-panel px-4 py-3 text-xs text-muted">
          <p>
            보낸 사람: {MAIL_SENDER.name} &lt;{MAIL_SENDER.email}&gt;
          </p>
          <p className="mt-1 text-sm font-bold text-text">
            {marketing && '(광고) '}
            {text(subject) || '제목'}
          </p>
        </div>
        <div className="min-h-40 px-4 py-4 text-sm leading-relaxed whitespace-pre-line">
          {text(body) || <span className="text-sub">내용</span>}
        </div>
        <div className="border-t border-border bg-panel px-4 py-3 text-[11px] leading-relaxed text-sub">
          {marketing ? (
            <>
              <p>
                {BUSINESS.name} · 대표 {BUSINESS.ceo} · 사업자등록번호{' '}
                {BUSINESS.businessNumber}
              </p>
              <p>
                {BUSINESS.address} · {BUSINESS.phone} · {BUSINESS.email}
              </p>
              <p>
                이 메일은 광고성 정보 수신에 동의한 분께 보내요.{' '}
                <span className="underline">수신 거부</span>
              </p>
            </>
          ) : (
            <p>
              서비스 이용에 꼭 필요한 안내라 메일 수신 설정과 관계없이 보내요.
            </p>
          )}
        </div>
      </div>
      <p className="text-xs text-sub">
        회원마다 앱 언어로 가요. 비어 있는 언어는 영어로 가요. 언어 옆 숫자는
        받을 회원 수예요.
      </p>
    </Card>
  )
}

export default MailPreview
