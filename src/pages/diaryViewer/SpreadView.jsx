import { useEffect, useRef, useState } from 'react'

const STROKE_WIDTH = 1000 // strokes use a 1000-unit wide spread

// Height of the element in px, kept up to date (text sizes follow it).
function useHeight() {
  const ref = useRef(null)
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setHeight(entry.contentRect.height),
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return [ref, height]
}

// One spread drawn like the member app's editor: background, photos in the
// template's frames, overlay, then stickers, text and pen. For checking a
// request — close to the app, not pixel-identical.
function SpreadView({ spread, template, stickers, fonts }) {
  const [ref, height] = useHeight()
  const aspect = template?.aspect ?? 297 / 210

  return (
    <div
      ref={ref}
      style={{ aspectRatio: aspect }}
      className="relative w-full overflow-hidden bg-white shadow-card"
    >
      {template ? (
        <>
          <img
            src={template.imageUrl}
            alt=""
            className="absolute inset-0 size-full"
          />
          {template.frames.map((frame) => {
            const photo = spread.frames[frame.id]
            return (
              <div
                key={frame.id}
                style={{
                  left: `${frame.x * 100}%`,
                  top: `${frame.y * 100}%`,
                  width: `${frame.width * 100}%`,
                  height: `${frame.height * 100}%`,
                  transform: `rotate(${frame.rotation}deg)`,
                }}
                className="absolute overflow-hidden bg-black/5"
              >
                {photo && (
                  <img
                    src={photo.photoUrl}
                    alt=""
                    style={{
                      width: `${photo.zoom * 100}%`,
                      height: `${photo.zoom * 100}%`,
                      left: `${50 + photo.x * 100}%`,
                      top: `${50 + photo.y * 100}%`,
                    }}
                    className="absolute max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
                  />
                )}
              </div>
            )
          })}
          {template.overlayUrl && (
            <img
              src={template.overlayUrl}
              alt=""
              className="absolute inset-0 size-full"
            />
          )}
        </>
      ) : (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-sub">
          템플릿을 쓰지 않은 페이지예요.
        </p>
      )}

      {spread.stickers.map((s, i) => {
        const sticker = stickers.find((x) => x.id === s.stickerId)
        return (
          sticker && (
            <img
              key={i}
              src={sticker.imageUrl}
              alt=""
              style={{
                left: `${s.x * 100}%`,
                top: `${s.y * 100}%`,
                width: `${s.width * 100}%`,
                transform: `rotate(${s.rotation}deg)`,
              }}
              className="absolute"
            />
          )
        )
      })}

      {spread.texts.map((t, i) => {
        const font = fonts.find((f) => f.id === t.fontId) ?? fonts[0]
        return (
          <p
            key={i}
            style={{
              left: `${t.x * 100}%`,
              top: `${t.y * 100}%`,
              fontFamily: font?.family,
              fontSize: t.size * height,
              transform: `rotate(${t.rotation}deg)`,
            }}
            className="absolute leading-tight whitespace-pre"
          >
            {t.text}
          </p>
        )
      })}

      {spread.strokes.length > 0 && (
        <svg
          viewBox={`0 0 ${STROKE_WIDTH} ${STROKE_WIDTH / aspect}`}
          className="pointer-events-none absolute inset-0 size-full"
        >
          {spread.strokes.map((stroke, i) => (
            <polyline
              key={i}
              points={stroke.points.map((p) => p.join(',')).join(' ')}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.size}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      )}
    </div>
  )
}

export default SpreadView
