import { useState } from 'react'
import { Outlet } from 'react-router'
import Sidebar from './Sidebar.jsx'

// Sidebar + page. From lg (1024px, laptops) the sidebar stays open on the
// left; narrower windows open it as a drawer from PageHeader's menu button.
function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh lg:pl-60">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 border-r border-border bg-white lg:block">
        <Sidebar />
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
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <Outlet context={{ openMenu: () => setMenuOpen(true) }} />
    </div>
  )
}

export default AdminLayout
