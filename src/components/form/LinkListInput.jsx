import { youTubeId } from '../../lib/places.js'
import { inputClass } from './inputClass.js'

// A list of links (e.g. the videos that make a place a fandom place), up to
// `max`. YouTube links show their thumbnail.
function LinkListInput({ value, onChange, max, invalid = false }) {
  const set = (i, url) => onChange(value.map((u, j) => (j === i ? url : u)))

  return (
    <div className="flex flex-col gap-2">
      {value.map((url, i) => {
        const videoId = youTubeId(url)
        return (
          <div key={i} className="flex items-center gap-2">
            {videoId ? (
              <img
                src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                alt=""
                className="h-10 w-[71px] shrink-0 rounded-md bg-chip object-cover"
              />
            ) : (
              <span className="flex h-10 w-[71px] shrink-0 items-center justify-center rounded-md bg-chip text-[11px] font-bold text-sub">
                LINK
              </span>
            )}
            <input
              type="url"
              aria-label={`자료화면 링크 ${i + 1}`}
              value={url}
              onChange={(event) => set(i, event.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              aria-invalid={invalid && !/^https?:\/\//.test(url)}
              className={`${inputClass} h-10`}
            />
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs font-semibold text-muted underline underline-offset-2"
              >
                열기
              </a>
            )}
            <button
              type="button"
              aria-label={`링크 ${i + 1} 빼기`}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="shrink-0 px-1.5 text-lg text-sub hover:text-danger"
            >
              ×
            </button>
          </div>
        )
      })}
      {value.length < max && (
        <button
          type="button"
          onClick={() => onChange([...value, ''])}
          className="w-fit text-sm font-semibold text-muted hover:text-text"
        >
          + 링크 추가 ({value.length}/{max})
        </button>
      )}
    </div>
  )
}

export default LinkListInput
