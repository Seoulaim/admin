// Short message at the bottom of the screen (useToast).
function Toast({ toast }) {
  if (!toast) return null

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-text px-5 py-2.5 text-sm font-medium text-white shadow-lg lg:ml-30"
    >
      {toast.message}
    </div>
  )
}

export default Toast
