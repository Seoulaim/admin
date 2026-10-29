// The template drawn small: background, frames (numbered), overlay.
function TemplateThumb({ template, className = '' }) {
  return (
    <div
      style={{ aspectRatio: template.aspect }}
      className={`relative overflow-hidden bg-chip ${className}`}
    >
      <img
        src={template.imageUrl}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full"
      />
      {template.frames.map((frame, i) => (
        <span
          key={frame.id}
          style={{
            left: `${frame.x * 100}%`,
            top: `${frame.y * 100}%`,
            width: `${frame.width * 100}%`,
            height: `${frame.height * 100}%`,
            transform: `rotate(${frame.rotation}deg)`,
          }}
          className="absolute flex items-center justify-center bg-info/20 text-[11px] font-bold text-info outline-1 outline-info/60"
        >
          {i + 1}
        </span>
      ))}
      {template.overlayUrl && (
        <img
          src={template.overlayUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 size-full"
        />
      )}
    </div>
  )
}

export default TemplateThumb
