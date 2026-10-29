import { useOutletContext } from 'react-router'

// Top bar of every screen: title, and the screen's main actions on the right
// (e.g. "새 프로모션 추가"). Below lg it also opens the sidebar drawer.
function PageHeader({ title, children }) {
  const { openMenu } = useOutletContext()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-white px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        aria-label="메뉴 열기"
        onClick={openMenu}
        className="-ml-1 flex size-9 items-center justify-center rounded-lg hover:bg-chip lg:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <h1 className="min-w-0 flex-1 truncate text-xl font-bold">{title}</h1>
      {children && (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      )}
    </header>
  )
}

export default PageHeader
