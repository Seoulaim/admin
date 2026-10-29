// Round photo, or the name's first letter when there's none.
function Avatar({ src, name, className = 'size-10' }) {
  return src ? (
    <img
      src={src}
      alt=""
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
