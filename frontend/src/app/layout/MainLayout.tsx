import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import api from '@/features/auth/api'
import {
  LayoutDashboard, FileText, Users, LogOut, ChevronRight, PanelLeftClose,
  PanelLeftOpen, Menu, AlertTriangle, Inbox, ShieldCheck, ClipboardCheck,
  PenTool, PenLine, DoorOpen, Settings2,
} from 'lucide-react'
import logo from '@/assets/logo.jpg'
import ThemeToggle from '@/components/ThemeToggle'
import { useSidebarStore } from '@/lib/sidebar'

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrateur',
  DIRECTEUR: 'Directeur',
  CHEF: 'Chef de service',
  INSTRUCTEUR: 'Instructeur',
  SAISIE: 'Agent de saisie',
}

const roleColors: Record<string, string> = {
  ADMIN: 'from-brand-500 to-brand-600',
  DIRECTEUR: 'from-amber-500 to-amber-600',
  CHEF: 'from-emerald-500 to-emerald-600',
  INSTRUCTEUR: 'from-brand-600 to-brand-500',
  SAISIE: 'from-emerald-600 to-emerald-500',
}

function getPageTitle(pathname: string): string {
  if (pathname === '/app') return 'Tableau de bord'
  if (pathname.startsWith('/app/accueil')) return 'Accueil et visites'
  if (pathname.startsWith('/app/reclamations')) {
    if (pathname.endsWith('/nouvelle')) return 'Nouvelle réclamation'
    if (pathname.split('/').length > 4) return 'Détail réclamation'
    return 'Réclamations'
  }
  if (pathname.startsWith('/app/contribuables')) {
    if (pathname.includes('/nouvelle') || pathname.includes('/modifier')) return 'Fiche contribuable'
    return 'Contribuables'
  }
  if (pathname.startsWith('/app/validations')) return 'Validations'
  if (pathname.startsWith('/app/instruction')) return 'Instruction'
  if (pathname.startsWith('/app/qualifier')) return 'Qualification'
  if (pathname.startsWith('/app/admin/utilisateurs')) return 'Utilisateurs'
  if (pathname.startsWith('/app/admin/referentiels')) return 'Référentiels'
  return ''
}

function NavItem({ to, icon: Icon, label, end, badge, collapsed, onNavigate }: {
  to: string; icon: any; label: string; end?: boolean; badge?: number; collapsed?: boolean; onNavigate?: () => void
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          collapsed ? 'justify-center' : ''
        } ${
          isActive
            ? 'bg-white/10 text-white shadow-lg shadow-black/10'
            : 'text-surface-400 hover:text-white hover:bg-white/5'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
            isActive
              ? 'bg-brand-500 shadow-lg shadow-brand-500/30'
              : 'bg-white/5 group-hover:bg-white/10'
          }`}>
            <Icon size={16} />
            {collapsed && typeof badge === 'number' && badge > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900" />
            )}
          </div>
          {!collapsed && <span className="flex-1">{label}</span>}
          {!collapsed && typeof badge === 'number' && badge > 0 && (
            <span className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-extrabold ${
              isActive ? 'bg-brand-500 text-white' : 'bg-amber-500/90 text-white'
            }`}>
              {badge}
            </span>
          )}
          {!collapsed && isActive && <ChevronRight size={14} className="text-surface-500" />}
        </>
      )}
    </NavLink>
  )
}

function SectionLabel({ children, collapsed }: { children: ReactNode; collapsed?: boolean }) {
  if (collapsed) return <div className="mx-4 my-3 border-t border-white/10" aria-hidden="true" />
  return (
    <p className="px-3 pt-5 pb-1.5 text-[10px] font-bold text-surface-500 tracking-[0.18em] uppercase">
      {children}
    </p>
  )
}

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebarStore()

  const isAdmin =
    user?.role?.libelle === 'ADMIN' ||
    (user?.role?.libelle as any)?.value === 'ADMIN'

  const { data: stats } = useQuery({
    queryKey: ['sidebar-stats'],
    queryFn: () => api.get('/api/v1/reclamations/stats').then((r) => r.data),
    refetchInterval: 60000,
  })

  const roleLibelle = user?.role?.libelle || ''
  const roleKey = typeof roleLibelle === 'string' ? roleLibelle : (roleLibelle as any)?.value || ''
  const gradientClass = roleColors[roleKey] || 'from-brand-500 to-brand-600'

  const peutValider = ['ADMIN', 'CHEF', 'DIRECTEUR'].includes(roleKey)
  const peutInstruire = ['ADMIN', 'INSTRUCTEUR'].includes(roleKey)
  const peutQualifier = ['ADMIN', 'SAISIE'].includes(roleKey)

  const { data: aValider } = useQuery({
    queryKey: ['sidebar-a-valider'],
    queryFn: () => api.get('/api/v1/reclamations/a-valider').then((r) => r.data),
    enabled: peutValider,
    refetchInterval: 30000,
  })

  const { data: aInstruire } = useQuery({
    queryKey: ['sidebar-a-instruire'],
    queryFn: () => api.get('/api/v1/reclamations/a-instruire').then((r) => r.data),
    enabled: peutInstruire,
    refetchInterval: 60000,
  })

  const { data: aQualifier } = useQuery({
    queryKey: ['sidebar-a-qualifier'],
    queryFn: () => api.get('/api/v1/reclamations/a-qualifier').then((r) => r.data),
    enabled: peutQualifier,
    refetchInterval: 60000,
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const closeMobile = () => setMobileOpen(false)

  const enRetard = stats?.en_retard || 0
  const total = stats?.total || 0
  // badge de la file d'attente selon le role
  const fileEnAvant = roleKey === 'DIRECTEUR'
    ? (aValider?.compteurs?.en_visa_directeur || 0)
    : (aValider?.compteurs?.en_validation || 0)
  // badge de la file d'instruction (INSTRUCTEUR)
  const fileInstruire = aInstruire?.total || 0
  // badge de la file de qualification (SAISIE)
  const fileQualifier = aQualifier?.total || 0

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 lg:inset-auto lg:relative z-50 lg:z-auto flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white overflow-hidden
          w-72 shrink-0 transition-[width,transform] duration-300 ease-in-out lg:shadow-none shadow-2xl
          ${collapsed ? 'lg:w-[76px]' : 'lg:w-72'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Decorative gradient orb */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-brand-400/10 rounded-full blur-3xl" />

        {/* Brand */}
        <div className={`relative z-10 flex items-center gap-3 p-5 pb-2 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-brand-500/30 ring-2 ring-white/10 shrink-0">
            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold tracking-tight">Reclamations</h1>
              <p className="text-[11px] text-surface-400 font-medium tracking-wide uppercase">DGI Madagascar</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
          <SectionLabel collapsed={collapsed}>Principal</SectionLabel>
          <NavItem to="/app" icon={LayoutDashboard} label="Tableau de bord" end badge={enRetard} collapsed={collapsed} onNavigate={closeMobile} />

          <SectionLabel collapsed={collapsed}>Gestion</SectionLabel>
          <NavItem to="/app/accueil" icon={DoorOpen} label="Accueil et visites" collapsed={collapsed} onNavigate={closeMobile} />
          <NavItem to="/app/reclamations" icon={FileText} label="Reclamations" collapsed={collapsed} onNavigate={closeMobile} />
          <NavItem to="/app/contribuables" icon={Users} label="Contribuables" collapsed={collapsed} onNavigate={closeMobile} />

          {peutValider && (
            <NavItem to="/app/validations" icon={ClipboardCheck} label="A valider" badge={fileEnAvant} collapsed={collapsed} onNavigate={closeMobile} />
          )}

          {peutInstruire && (
            <NavItem to="/app/instruction" icon={PenTool} label="A instruire" badge={fileInstruire} collapsed={collapsed} onNavigate={closeMobile} />
          )}

          {peutQualifier && (
            <NavItem to="/app/qualifier" icon={PenLine} label="A qualifier" badge={fileQualifier} collapsed={collapsed} onNavigate={closeMobile} />
          )}

          {isAdmin && (
            <>
              <SectionLabel collapsed={collapsed}>Administration</SectionLabel>
              <NavItem to="/app/admin/utilisateurs" icon={ShieldCheck} label="Utilisateurs" collapsed={collapsed} onNavigate={closeMobile} />
              <NavItem to="/app/admin/referentiels" icon={Settings2} label="Referentiels" collapsed={collapsed} onNavigate={closeMobile} />
            </>
          )}

          {/* Alert summary card */}
          {!collapsed && (
            <div className="mt-6 mx-1 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Inbox size={14} className="text-brand-300" />
                <p className="text-[11px] font-bold text-surface-300 dark:text-slate-300 tracking-wide uppercase">Synthese</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-400 text-xs">Reclamations</span>
                <span className="font-bold text-white text-sm tabular-nums">{total}</span>
              </div>
              {enRetard > 0 && (
                <div className="flex items-center justify-between text-sm mt-1.5">
                  <span className="text-surface-400 text-xs flex items-center gap-1">
                    <AlertTriangle size={12} className="text-amber-400" /> En retard
                  </span>
                  <span className="font-bold text-amber-400 text-sm tabular-nums">{enRetard}</span>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* User Profile */}
        <div className="relative z-10 p-3 lg:p-4 mx-2 lg:mx-3 mb-3 rounded-xl bg-white/5 border border-white/5">
          {collapsed ? (
            <div className="flex flex-col items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-sm font-bold shadow-lg`}>
                {user?.nom?.charAt(0) || '?'}
              </div>
              <button
                onClick={handleLogout}
                title="Deconnexion"
                aria-label="Deconnexion"
                className="flex items-center justify-center w-8 h-8 rounded-lg text-surface-400 hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-sm font-bold shadow-lg`}>
                {user?.nom?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.nom}</p>
                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-gradient-to-r ${gradientClass} text-white shadow-sm`}>
                  {roleLabels[roleKey] || roleKey}
                </span>
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-surface-400 hover:text-white w-full px-3 py-2 rounded-lg hover:bg-white/5 transition-all duration-200"
            >
              <LogOut size={14} />
              Deconnexion
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-3 bg-surface-50/80 backdrop-blur-lg border-b border-surface-100 dark:bg-surface-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl border border-surface-200 bg-white/70 text-surface-700 hover:bg-surface-50 shadow-sm"
              aria-label="Ouvrir le menu"
            >
              <Menu size={18} />
            </button>
            <button
              onClick={toggleCollapsed}
              className="hidden lg:inline-flex items-center justify-center w-9 h-9 rounded-xl border border-surface-200 bg-white/70 text-surface-700 hover:bg-surface-50 shadow-sm"
              aria-label={collapsed ? 'Étendre le menu' : 'Réduire le menu'}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <div className="min-w-0">
              <h2 className="text-base lg:text-lg font-bold text-surface-900 tracking-tight truncate">
                {getPageTitle(pathname)}
              </h2>
              <p className="hidden sm:block text-xs text-surface-400 truncate">
                {roleLabels[roleKey] || roleKey}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}