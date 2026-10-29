import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { login } from '../api/session.js'
import logo from '../assets/logo.svg'
import Button from '../components/Button.jsx'
import { inputClass } from '../components/form/inputClass.js'

// Operator log in (one shared account; the backend checks it). ?redirect=
// brings the admin back to where they were.
function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login({ id, password })
      const back = searchParams.get('redirect')
      navigate(back?.startsWith('/') ? back : '/', { replace: true })
    } catch (e) {
      setError(
        e.code === 'INVALID_CREDENTIALS'
          ? '아이디 또는 비밀번호가 맞지 않아요.'
          : '로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.',
      )
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-white p-8 shadow-card"
      >
        <div className="mb-2 flex items-center justify-center gap-2">
          <img src={logo} alt="Seoulaim" className="h-6 w-auto" />
          <span className="text-lg font-medium text-muted">admin</span>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          아이디
          <input
            value={id}
            onChange={(event) => setId(event.target.value)}
            autoComplete="username"
            className={`${inputClass} h-11 font-normal`}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className={`${inputClass} h-11 font-normal`}
          />
        </label>
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          className="h-11"
          disabled={busy}
        >
          {busy ? '로그인 중…' : '로그인'}
        </Button>
        <p className="text-center text-xs text-sub">운영자 전용 페이지예요.</p>
      </form>
    </main>
  )
}

export default LoginPage
