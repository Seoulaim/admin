import { useEffect } from 'react'

// A modal panel: title, content and footer buttons. Escape or the backdrop
// closes it (onClose).
function Dialog({
  open,
  title,
  onClose,
  footer,
  children,
  className = 'max-w-lg',
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={`relative flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-2xl bg-white shadow-xl ${className}`}
      >
        <h2 id="dialog-title" className="px-6 pt-5 pb-3 text-lg font-bold">
          {title}
        </h2>
        <div className="overflow-y-auto px-6 pb-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dialog
