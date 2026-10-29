// Shown in place of content that failed to load (useFetch's error).
// The caller places it (padding / height) with className.
function LoadError({ onRetry, className = '' }) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 text-center ${className}`}
    >
      <p className="text-sm text-sub">불러오지 못했어요.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-point px-4 py-1.5 text-xs font-semibold text-point-strong"
        >
          다시 시도
        </button>
      )}
    </div>
  )
}

export default LoadError
