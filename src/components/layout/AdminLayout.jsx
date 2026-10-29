import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { getAdminSession, logout } from '../../api/session.js'
import { useFetch } from '../../hooks/useFetch.js'
import { LOGIN_REQUIRED_EVENT } from '../../lib/apiClient.js'
import ConfirmDialog from '../ConfirmDialog.jsx'
import Sidebar from './Sidebar.jsx'

// Sidebar + page, for the logged-in operator (others go to /login and come
// back afterwards). From lg (1024px, laptops) the sidebar stays open on the
// left; narrower windows open it as a drawer from PageHeader's menu button.
function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: session, update } = useFetch(getAdminSession)
  const [confirming, setConfirming] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const here = location.pathname + location.search
  const toLogin = `/login?redirect=${encodeURIComponent(here)}`

  // A request answered 401 (session expired): log in again.
  useEffect(() => {
    const onExpired = () => navigate(toLogin, { replace: true })
    window.addEventListener(LOGIN_REQUIRED_EVENT, onExpired)
    return () => window.removeEventListener(LOGIN_REQUIRED_EVENT, onExpired)
  }, [navigate, toLogin])

  async function signOut() {
    await logout().catch(() => {})
    update(() => ({ loggedIn: false }))
    navigate('/login', { replace: true })
  }

  if (!session) return null
  if (!session.loggedIn) return <Navigate to={toLogin} replace />

  const sidebar = (onNavigate) => (
    <Sidebar
      admin={session}
      onLogout={() => setConfirming(true)}
      onNavigate={onNavigate}
    />
  )

  return (
    <div className="min-h-dvh lg:pl-60">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 border-r border-border bg-white lg:block">
        {sidebar()}
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <aside className="absolute inset-y-0 left-0 w-60 bg-white shadow-xl">
            {sidebar(() => setMenuOpen(false))}
          </aside>
        </div>
      )}

      <Outlet context={{ openMenu: () => setMenuOpen(true) }} />
      <ConfirmDialog
        open={confirming}
        title="로그아웃할까요?"
        confirmLabel="로그아웃"
        onConfirm={signOut}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}

export default AdminLayout
