import { useRef, useState } from 'react'
import { uploadImage } from '../../api/uploads.js'
import { useDragSort } from '../../hooks/useDragSort.js'
import { moveItem } from '../../lib/arrays.js'

// Up to `max` photos, uploaded when picked (several at once is fine). Drag
// to reorder; the first one is the main photo.
function PhotoListInput({ value, onChange, max, aspect }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(0)
  const [failed, setFailed] = useState(false)
  const dragProps = useDragSort((from, to) =>
    onChange(moveItem(value, from, to)),
  )
  const room = max - value.length - uploading

  async function upload(files) {
    const picked = [...files].slice(0, room)
    if (picked.length === 0) return
    setFailed(false)
    setUploading((n) => n + picked.length)
    const results = await Promise.allSettled(picked.map(uploadImage))
    setUploading((n) => n - picked.length)
    const urls = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value.url)
    if (urls.length < picked.length) setFailed(true)
    if (urls.length > 0) onChange((current) => [...current, ...urls])
  }

  const tile = 'relative overflow-hidden rounded-lg'
  const ratio = { aspectRatio: `${aspect.width} / ${aspect.height}` }

  return (
    <div className="flex flex-col gap-2">
      <ol className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
        {value.map((url, index) => (
          <li
            key={url}
            {...dragProps(index)}
            style={ratio}
            className={`${tile} group cursor-grab bg-chip active:cursor-grabbing`}
          >
            <img
              src={url}
              alt=""
              draggable={false}
              className="size-full object-cover"
            />
            <span className="absolute top-1.5 left-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-bold text-white">
              {index === 0 ? '대표' : index + 1}
            </span>
            <button
              type="button"
              aria-label={`사진 ${index + 1} 빼기`}
              onClick={() => onChange(value.filter((u) => u !== url))}
              className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/55 text-sm text-white hover:bg-danger"
            >
              ×
            </button>
          </li>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <li
            key={`uploading-${i}`}
            style={ratio}
            className={`${tile} flex items-center justify-center bg-chip text-xs text-sub`}
          >
            올리는 중…
          </li>
        ))}
        {room > 0 && (
          <li style={ratio}>
            <button
              type="button"
              onClick={() => inputRef.current.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                upload(event.dataTransfer.files)
              }}
              className={`${tile} flex size-full flex-col items-center justify-center gap-0.5 border-2 border-dashed border-border bg-chip text-sm font-semibold text-muted hover:border-point`}
            >
              + 사진
              <span className="text-[11px] font-medium text-sub">
                {value.length}/{max}
              </span>
            </button>
          </li>
        )}
      </ol>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          upload(event.target.files)
          event.target.value = ''
        }}
      />
      {failed && (
        <p className="text-xs font-medium text-warn">
          올리지 못한 사진이 있어요. 다시 시도해 주세요.
        </p>
      )}
    </div>
  )
}

export default PhotoListInput
