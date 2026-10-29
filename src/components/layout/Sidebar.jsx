import { Link, NavLink } from 'react-router'
import logo from '../../assets/logo.svg'
import { MENU } from '../../menu.js'

// admin: the session ({ name, email }). onNavigate: closes the drawer on
// narrow windows.
function Sidebar({ admin, onLogout, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2 pr-3 pl-5">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2">
          <img src={logo} alt="Seoulaim" className="h-[18px] w-auto" />
          <span className="text-[15px] font-medium text-muted">admin</span>
        </Link>
        <button
          type="button"
          onClick={onLogout}
          aria-label="로그아웃"
          title="로그아웃"
          className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg text-sub hover:bg-chip hover:text-text"
        >
          {/* A door with an arrow leaving it. */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {MENU.map((group) => (
          <section key={group.title} className="mt-4 first:mt-1">
            <h2 className="px-3 pb-1 text-xs font-medium text-sub">
              {group.title}
            </h2>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-[15px] font-semibold ${
                        isActive
                          ? 'bg-point text-white'
                          : 'text-text hover:bg-chip'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-3 border-t border-border px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-full bg-point-soft text-sm font-semibold text-point-strong">
          {admin?.name.slice(0, 1)}
        </span>
        <div className="min-w-0 text-sm leading-tight">
          <p className="truncate font-semibold">{admin?.name}</p>
          <p className="truncate text-xs text-sub">{admin?.email}</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
