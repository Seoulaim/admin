import { useRef, useState } from 'react'
import { uploadImage } from '../../api/uploads.js'

const gcd = (a, b) => (b ? gcd(b, a % b) : a)

// How far off the expected ratio an image may be before we warn (2%).
const RATIO_TOLERANCE = 0.02

// Drop or pick an image; it's uploaded right away and value becomes its URL.
// aspect: { width, height } the screen shows it at — other ratios get
// cropped in the app, so they're warned about (still allowed).
// sizeClass: the drop area's width (it keeps the aspect ratio). compact:
// short labels for small areas (e.g. member photos).
function ImageInput({
  id,
  value,
  onChange,
  aspect,
  invalid = false,
  sizeClass = 'w-full max-w-md',
  compact = false,
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [message, setMessage] = useState(null)
  const divisor = gcd(aspect.width, aspect.height)
  const ratio = `${aspect.width / divisor}:${aspect.height / divisor}`

  async function upload(file) {
    if (!file) return
    setUploading(true)
    setMessage(null)
    try {
      const image = await uploadImage(file)
      onChange(image.url)
      const expected = aspect.width / aspect.height
      if (
        Math.abs(image.width / image.height / expected - 1) > RATIO_TOLERANCE
      ) {
        setMessage({
          warn: true,
          text: `올린 이미지는 ${image.width}×${image.height}px이에요. ${ratio} 비율이 아니면 앱에서 가장자리가 잘려요.`,
        })
      } else {
        setMessage({ text: `${image.width}×${image.height}px` })
      }
    } catch {
      setMessage({
        warn: true,
        text: '이미지를 올리지 못했어요. 다시 시도해 주세요.',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          upload(event.dataTransfer.files[0])
        }}
        style={{ aspectRatio: `${aspect.width} / ${aspect.height}` }}
        className={`relative shrink-0 ${sizeClass} overflow-hidden rounded-xl border-2 border-dashed ${dragging ? 'border-point bg-point-soft' : invalid ? 'border-danger' : 'border-border bg-chip'}`}
      >
        {value && <img src={value} alt="" className="size-full object-cover" />}
        <button
          type="button"
          id={id}
          onClick={() => inputRef.current.click()}
          disabled={uploading}
          className={`absolute inset-0 flex flex-col items-center justify-center gap-1 text-sm font-semibold ${value ? 'bg-black/0 text-transparent hover:bg-black/40 hover:text-white focus-visible:bg-black/40 focus-visible:text-white' : 'text-muted'}`}
        >
          {uploading ? (
            <span className="rounded-full bg-white/90 px-3 py-1 text-muted">
              올리는 중…
            </span>
          ) : (
            <>
              <span>
                {value
                  ? compact
                    ? '바꾸기'
                    : '이미지 바꾸기'
                  : compact
                    ? '+ 사진'
                    : '이미지를 끌어다 놓거나 클릭'}
              </span>
              {!value && !compact && (
                <span className="text-xs font-medium text-sub">
                  {ratio} 비율, 가로 {aspect.width * 2}px 이상 권장
                </span>
              )}
            </>
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          upload(event.target.files[0])
          event.target.value = ''
        }}
      />
      {message && (
        <p
          className={`text-xs ${message.warn ? 'font-medium text-warn' : 'text-sub'}`}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}

export default ImageInput
