import { Link, useRouteError } from 'react-router'

// Any screen that throws while rendering: a way back instead of a blank page.
function RouteErrorPage() {
  const error = useRouteError()
  console.error(error)

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-bold">화면에 문제가 생겼어요.</h1>
      <p className="text-sm text-sub">
        새로고침해 보고, 계속되면 개발자에게 알려 주세요.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full border border-point px-4 py-1.5 text-sm font-semibold text-point-strong"
        >
          새로고침
        </button>
        <Link
          to="/"
          reloadDocument
          className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold"
        >
          대시보드로
        </Link>
      </div>
    </main>
  )
}

export default RouteErrorPage
