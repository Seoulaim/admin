import { useState } from 'react'

// Round photo, or the name's first letter when there's none or it fails
// to load (so a broken image never changes the row's size).
function Avatar({ src, name, className = 'size-10' }) {
  const [failedSrc, setFailedSrc] = useState(null)

  return src && src !== failedSrc ? (
    <img
      src={src}
      alt=""
      onError={() => setFailedSrc(src)}
      className={`shrink-0 rounded-full bg-chip object-cover ${className}`}
    />
  ) : (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-point-soft font-bold text-point-strong ${className}`}
    >
      {name.slice(0, 1)}
    </span>
  )
}

export default Avatar
