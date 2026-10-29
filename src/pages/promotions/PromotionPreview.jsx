import { useState } from 'react'
import Card from '../../components/Card.jsx'
import { LANGUAGES } from '../../lib/languages.js'
import { BANNER_HEIGHT, BANNER_WIDTH } from '../../lib/promotions.js'

// The banner as the member app draws it (HH01 MainPromo / DD01
// DiaryBanners, at the app's 393px width), in a chosen language — empty
// languages fall back to English like the app.
function PromotionPreview({ promotion }) {
  const [language, setLanguage] = useState('en')
  const text = (value) => value?.[language] || value?.en || ''
  const title = text(promotion.title)
  const description = text(promotion.description)

  return (
    <Card className="flex flex-col gap-4 p-4 xl:sticky xl:top-24">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">앱 미리보기</h2>
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

      <div
        className="relative w-full max-w-[393px] self-center overflow-hidden bg-[#d9d9d9]"
        style={{ aspectRatio: `${BANNER_WIDTH} / ${BANNER_HEIGHT}` }}
      >
        {promotion.imageUrl && (
          <img
            src={promotion.imageUrl}
            alt=""
            className="size-full object-cover"
          />
        )}
        {promotion.placement === 'DIARY' ? (
          <span className="absolute top-[32.5px] left-[21px] flex flex-col items-start gap-5 text-left whitespace-pre-line">
            <span className="flex flex-col gap-1.5">
              <span className="text-xl leading-[26px] font-semibold text-[#003160]">
                {title}
              </span>
              <span className="text-[10px] leading-[14px] font-medium text-muted">
                {description}
              </span>
            </span>
            {text(promotion.ctaLabel) && (
              <span className="rounded-full bg-point px-3 py-1.5 text-[10px] leading-[14px] font-semibold text-white">
                {text(promotion.ctaLabel)}
              </span>
            )}
          </span>
        ) : (
          (title || description) && (
            <span className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-linear-to-t from-black/60 via-black/25 to-transparent px-4 pt-10 pb-3.5 text-left text-white">
              {title && (
                <span className="truncate text-lg leading-tight font-bold drop-shadow-sm">
                  {title}
                </span>
              )}
              {description && (
                <span className="truncate text-xs leading-snug text-white/85">
                  {description}
                </span>
              )}
            </span>
          )
        )}
      </div>
      <p className="text-xs text-sub">
        {promotion.placement === 'DIARY'
          ? '다이어리 탭(DD01) 위쪽 배너'
          : '홈(HH01) 맨 위 배너'}
        와 같은 크기예요. 비어 있는 언어는 영어로 보여요.
      </p>
    </Card>
  )
}

export default PromotionPreview
