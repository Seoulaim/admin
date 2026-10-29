import { useEffect, useState } from 'react'

const SAMPLE = 'Seoul trip · 서울 여행 · 首尔旅行 · ソウル旅行'
const BASE_SIZE = 22 // px, before previewScale

// Adds the font's CSS to the page once per URL.
function useStylesheet(url) {
  useEffect(() => {
    if (
      !url ||
      document.querySelector(`link[data-font="${CSS.escape(url)}"]`)
    ) {
      return
    }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    link.crossOrigin = 'anonymous'
    link.dataset.font = url
    document.head.append(link)
  }, [url])
}

// The sample text in the font, and whether the browser could load it
// (a wrong family name or URL falls back to another font silently).
function FontPreview({ family, stylesheetUrl, previewScale = 1 }) {
  useStylesheet(stylesheetUrl)
  const [status, setStatus] = useState({ key: null, loaded: null })
  const key = `${family}|${stylesheetUrl}`

  useEffect(() => {
    if (!family) return
    let ignore = false
    const check = () =>
      document.fonts
        .load(`${BASE_SIZE}px ${family}`, SAMPLE)
        .then(
          (faces) => !ignore && setStatus({ key, loaded: faces.length > 0 }),
        )
        .catch(() => !ignore && setStatus({ key, loaded: false }))
    // Give the stylesheet a moment to arrive before asking.
    const timer = setTimeout(check, 800)
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [family, key])

  const loaded = status.key === key ? status.loaded : null

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p
        style={{ fontFamily: family, fontSize: BASE_SIZE * previewScale }}
        className="truncate leading-normal"
      >
        {SAMPLE}
      </p>
      <p
        className={`text-[11px] font-semibold ${loaded === false ? 'text-danger' : loaded ? 'text-ok' : 'text-sub'}`}
      >
        {loaded === null
          ? '폰트 확인 중…'
          : loaded
            ? '폰트를 불러왔어요'
            : '폰트를 불러오지 못했어요 — font-family 이름과 CSS 주소를 확인해 주세요'}
      </p>
    </div>
  )
}

export default FontPreview
