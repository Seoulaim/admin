import { useRef } from 'react'

const MIN_SIZE = 0.02 // smallest frame side, as a fraction of the image
const SNAP_DEGREES = 2 // rotation this close to 0 snaps to 0

const toRadians = (degrees) => (degrees * Math.PI) / 180

// Rotates the vector (x, y) by `degrees`.
function rotate(x, y, degrees) {
  const r = toRadians(degrees)
  return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)]
}

// The template as the editor draws it: background, photo frames, then the
// overlay on top. Frames can be dragged (move), resized from the corner
// dot and rotated from the top dot. frames use the template format
// (fractions of the image, unrotated top-left, rotation around the center).
function FrameEditor({
  imageUrl,
  overlayUrl,
  showOverlay,
  aspect,
  frames,
  selectedId,
  onSelect,
  onChange,
}) {
  const boxRef = useRef(null)
  const gesture = useRef(null)

  function begin(event, frame, kind) {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    onSelect(frame.id)
    const rect = boxRef.current.getBoundingClientRect()
    gesture.current = {
      kind,
      frame,
      rect,
      startX: event.clientX,
      startY: event.clientY,
    }
  }

  function moveTo(event) {
    const g = gesture.current
    if (!g) return
    const { frame, rect } = g
    const W = rect.width
    const H = rect.height
    const dx = event.clientX - g.startX
    const dy = event.clientY - g.startY
    let next

    if (g.kind === 'move') {
      next = { ...frame, x: frame.x + dx / W, y: frame.y + dy / H }
    } else if (g.kind === 'resize') {
      // Keep the opposite (top-left) corner where it is, in rotated space.
      const w = frame.width * W
      const h = frame.height * H
      const [ldx, ldy] = rotate(dx, dy, -frame.rotation)
      const nw = Math.max(MIN_SIZE * W, w + ldx)
      const nh = Math.max(MIN_SIZE * H, h + ldy)
      const cx = frame.x * W + w / 2
      const cy = frame.y * H + h / 2
      const [ox, oy] = rotate(-w / 2, -h / 2, frame.rotation)
      const [nx, ny] = rotate(nw / 2, nh / 2, frame.rotation)
      const ncx = cx + ox + nx
      const ncy = cy + oy + ny
      next = {
        ...frame,
        x: (ncx - nw / 2) / W,
        y: (ncy - nh / 2) / H,
        width: nw / W,
        height: nh / H,
      }
    } else {
      const cx = rect.left + (frame.x + frame.width / 2) * W
      const cy = rect.top + (frame.y + frame.height / 2) * H
      let degrees =
        (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI +
        90
      if (degrees > 180) degrees -= 360
      if (event.shiftKey) degrees = Math.round(degrees / 15) * 15
      else if (Math.abs(degrees) < SNAP_DEGREES) degrees = 0
      next = { ...frame, rotation: Math.round(degrees * 10) / 10 }
    }
    onChange(next)
  }

  const end = () => {
    gesture.current = null
  }

  return (
    <div
      ref={boxRef}
      onPointerDown={() => onSelect(null)}
      style={{ aspectRatio: aspect }}
      className="relative w-full touch-none rounded-lg bg-chip select-none"
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 size-full"
        />
      )}
      {frames.map((frame, index) => {
        const selected = frame.id === selectedId
        const handle =
          'absolute size-3.5 rounded-full border-2 border-white bg-point-strong shadow'
        return (
          <div
            key={frame.id}
            onPointerDown={(event) => begin(event, frame, 'move')}
            onPointerMove={moveTo}
            onPointerUp={end}
            style={{
              left: `${frame.x * 100}%`,
              top: `${frame.y * 100}%`,
              width: `${frame.width * 100}%`,
              height: `${frame.height * 100}%`,
              transform: `rotate(${frame.rotation}deg)`,
            }}
            className={`absolute cursor-move ${selected ? 'z-10 bg-point/35 outline-2 outline-point-strong' : 'bg-info/25 outline-2 outline-info/70 hover:bg-info/35'}`}
          >
            <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 text-[11px] font-bold text-white tabular-nums">
              {index + 1}
            </span>
            {selected && (
              <>
                <span
                  aria-hidden="true"
                  onPointerDown={(event) => begin(event, frame, 'resize')}
                  onPointerMove={moveTo}
                  onPointerUp={end}
                  className={`${handle} -right-2 -bottom-2 cursor-nwse-resize`}
                />
                <span
                  aria-hidden="true"
                  onPointerDown={(event) => begin(event, frame, 'rotate')}
                  onPointerMove={moveTo}
                  onPointerUp={end}
                  className={`${handle} -top-6 left-1/2 -ml-[7px] cursor-grab`}
                />
                <span className="pointer-events-none absolute -top-4 left-1/2 h-4 w-0.5 -translate-x-1/2 bg-point-strong" />
              </>
            )}
          </div>
        )
      })}
      {overlayUrl && showOverlay && (
        <img
          src={overlayUrl}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 z-20 size-full"
        />
      )}
    </div>
  )
}

export default FrameEditor
