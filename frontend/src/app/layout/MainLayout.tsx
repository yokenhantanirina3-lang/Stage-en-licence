import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { LayoutDashboard, FileText, Users, Settings, LogOut } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/reclamations', label: 'Reclamations', icon: FileText },
  { to: '/contribuables', label: 'Contribuables', icon: Users },
]

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrateur',
  DIRECTEUR: 'Directeur',
  CHEF: 'Chef de service',
  INSTRUCTEUR: 'Instructeur',
  SAISIE: 'Agent de saisie',
}

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isAdmin =
    user?.role?.libelle === 'ADMIN' ||
    (user?.role?.libelle as any)?.value === 'ADMIN'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-800 text-white flex flex-col">
        <div className="p-4 border-b border-primary-700">
          <h1 className="text-lg font-bold">Reclamations Fiscales</h1>
          <p className="text-xs text-primary-200 mt-1">Plateforme de gestion</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-primary-200 hover:bg-primary-700 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/admin/utilisateurs"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-primary-200 hover:bg-primary-700 hover:text-white'
                }`
              }
            >
              <Settings size={18} />
              Administration
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-primary-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.nom?.charAt(0) || '?'}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.nom}</p>
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-600 text-white">
                {roleLabels[user?.role?.libelle || ''] || user?.role?.libelle}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-primary-200 hover:text-white w-full px-3 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <LogOut size={16} />
            Deconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
