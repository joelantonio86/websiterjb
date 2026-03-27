import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const linkBase =
  'px-3 py-2 rounded-xl text-sm font-semibold transition-colors border'

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/convites', label: 'Convites' },
    { to: '/admin/membros', label: 'Membros' },
    { to: '/admin/midia', label: 'Mídia' },
  ]

  const canFinance =
    user?.role === 'financeiro' ||
    user?.role === 'admin-financeiro' ||
    user?.role === 'financeiro-view'

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rjb-bg-light via-rjb-bg-light/95 to-rjb-yellow/5 dark:from-rjb-bg-dark dark:via-rjb-bg-dark/95 dark:to-rjb-yellow/5 pt-16 sm:pt-20 md:pt-28 pb-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-rjb-yellow/20 bg-rjb-card-light/70 dark:bg-rjb-card-dark/70 shadow-lg p-5 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-rjb-yellow">Painel Administrativo</h1>
              <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1 break-all">
                {user?.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canFinance && (
                <button
                  onClick={() => navigate('/financeiro')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
                >
                  Financeiro
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/50 text-rjb-yellow font-semibold py-2.5 px-4 rounded-xl hover:bg-rjb-yellow/10 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 sm:gap-6">
          <aside className="lg:sticky lg:top-24 h-fit">
            {/* Mobile tabs */}
            <nav className="lg:hidden rounded-2xl border border-rjb-yellow/20 bg-rjb-card-light/70 dark:bg-rjb-card-dark/70 shadow-lg p-3 flex flex-wrap gap-2">
              {navItems.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  className={({ isActive }) =>
                    `${linkBase} ${
                      isActive
                        ? 'border-rjb-yellow/60 bg-rjb-yellow/15 text-rjb-yellow'
                        : 'border-rjb-yellow/20 hover:bg-rjb-yellow/10 text-rjb-text dark:text-rjb-text-dark'
                    }`
                  }
                  end={it.to === '/admin'}
                >
                  {it.label}
                </NavLink>
              ))}
            </nav>

            {/* Desktop sidebar */}
            <nav className="hidden lg:block rounded-2xl border border-rjb-yellow/20 bg-rjb-card-light/70 dark:bg-rjb-card-dark/70 shadow-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-rjb-yellow/15 bg-rjb-yellow/5">
                <p className="text-sm font-bold text-rjb-text dark:text-rjb-text-dark">Menu</p>
                <p className="text-xs text-rjb-text/60 dark:text-rjb-text-dark/60 mt-0.5">
                  {location.pathname}
                </p>
              </div>
              <div className="p-3 space-y-2">
                {navItems.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    className={({ isActive }) =>
                      `block ${linkBase} ${
                        isActive
                          ? 'border-rjb-yellow/60 bg-rjb-yellow/15 text-rjb-yellow'
                          : 'border-rjb-yellow/20 hover:bg-rjb-yellow/10 text-rjb-text dark:text-rjb-text-dark'
                      }`
                    }
                    end={it.to === '/admin'}
                  >
                    {it.label}
                  </NavLink>
                ))}
              </div>
            </nav>
          </aside>

          <main className="space-y-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout

