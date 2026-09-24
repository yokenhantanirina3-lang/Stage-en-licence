import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/useAuth'
import api from '@/features/auth/api'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/lib/theme'
import { SkeletonCards } from '@/components/Skeleton'
import PageHero from '@/components/PageHero'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import {
  FileText, Clock, AlertTriangle, CheckCircle,
  ArrowUpRight, TrendingUp, Activity, Users, BarChart3,
  Hash, Calendar, Briefcase, ClipboardCheck, PenTool, Eye, CalendarClock,
} from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler)

const STATUT_COLORS: Record<string, string> = {
  ENREGISTREE: '#94a3b8',
  A_QUALIFIER: '#f59e0b',
  EN_INSTRUCTION: '#6366f1',
  EN_ATTENTE_PIECES: '#fbbf24',
  PROJET_REPONSE: '#818cf8',
  EN_VALIDATION: '#34d399',
  EN_VISA_DIRECTEUR: '#6366f1',
  SIGNEE: '#10b981',
  NOTIFIEE: '#6ee7b7',
  CLOTUREE: '#10b981',
  REJETEE: '#d97706',
  CONTENTIEUX_JUDICIAIRE: '#f59e0b',
}

const STATUT_BADGE: Record<string, string> = {
  ENREGISTREE: 'bg-surface-100 text-surface-600',
  A_QUALIFIER: 'bg-amber-50 text-amber-700',
  EN_INSTRUCTION: 'bg-brand-50 text-brand-700',
  EN_ATTENTE_PIECES: 'bg-amber-100 text-amber-800',
  PROJET_REPONSE: 'bg-brand-100 text-brand-800',
  EN_VALIDATION: 'bg-emerald-50 text-emerald-700',
  EN_VISA_DIRECTEUR: 'bg-brand-50 text-brand-700',
  SIGNEE: 'bg-emerald-100 text-emerald-800',
  NOTIFIEE: 'bg-emerald-50 text-emerald-700',
  CLOTUREE: 'bg-emerald-50 text-emerald-700',
  REJETEE: 'bg-amber-100 text-amber-900',
}

const STATUT_FR: Record<string, string> = {
  ENREGISTREE: 'Enregistrée',
  A_QUALIFIER: 'À qualifier',
  EN_INSTRUCTION: 'En instruction',
  EN_ATTENTE_PIECES: 'En attente pièces',
  PROJET_REPONSE: 'Projet réponse',
  EN_VALIDATION: 'En validation',
  EN_VISA_DIRECTEUR: 'Visa directeur',
  SIGNEE: 'Signée',
  NOTIFIEE: 'Notifiée',
  CLOTUREE: 'Clôturée',
  REJETEE: 'Rejetée',
}

const TYPE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#d97706', '#818cf8']

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0)
  const ref = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) { setCount(0); return }
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }
    ref.current = requestAnimationFrame(animate)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  }, [target, duration])

  return count
}

function AnimatedStatCard({
  label, value, suffix = '', icon: Icon, gradient, glow, delay, total, hint,
}: {
  label: string; value: number; suffix?: string; icon: any; gradient: string; glow: string; delay: number
  total?: number; hint?: string
}) {
  const displayValue = useCountUp(value)
  const pct = total && total > 0 ? Math.round((value / total) * 100) : null

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-white border border-surface-100 dark:border-slate-700/60 shadow-card hover:shadow-elevated hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500"
      style={{ animationDelay: `${delay}ms`, animation: 'slideUp 0.6s ease-out backwards' }}
    >
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-[0.08] group-hover:opacity-[0.16] group-hover:scale-125 transition-all duration-700 blur-2xl`} />
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${gradient} opacity-80`} />

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${glow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
            <Icon size={22} className="text-white" strokeWidth={2.5} />
          </div>
          {pct !== null && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-50 text-[11px] font-bold text-surface-600 border border-surface-100 group-hover:bg-white transition-colors">
              {pct}%
            </span>
          )}
        </div>

        <div>
          <p className="text-[13px] font-medium text-surface-400 tracking-wide">{label}</p>
          <p className="text-4xl font-extrabold text-surface-900 mt-1 tracking-tighter">
            {displayValue}
            {suffix && <span className="text-2xl font-bold text-surface-500 ml-0.5">{suffix}</span>}
          </p>
        </div>

        {pct !== null && (
          <div className="mt-4 h-1.5 bg-surface-100 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${pct}%`, transitionDelay: `${300 + delay}ms` }}
            />
          </div>
        )}
        {hint && !pct && (
          <p className="mt-4 text-xs font-medium text-surface-400 flex items-center gap-1.5">
            <TrendingUp size={13} className="text-brand-400" />
            {hint}
          </p>
        )}
      </div>

      <div className={`h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-all duration-500`} />
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const theme = useThemeStore((s) => s.theme)
  const dark = theme === 'dark'
  const chartGrid = dark ? '#334155' : '#f1f5f9'
  const chartTick = dark ? '#94a3b8' : '#94a3b8'
  const chartSegmentBorder = dark ? '#0f172a' : '#ffffff'
  const chartLegendColor = dark ? '#cbd5e1' : '#64748b'
  const role = user?.role?.libelle
  const showAgent = ['ADMIN', 'CHEF', 'DIRECTEUR'].includes(role || '')

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats-dashboard'],
    queryFn: () => api.get('/api/v1/reclamations/stats').then((r) => r.data),
  })

  const { data: derniers } = useQuery({
    queryKey: ['reclamations-derniers'],
    queryFn: () => api.get('/api/v1/reclamations/', { params: { size: 6 } }).then((r) => r.data),
  })

  const showRelances = ['ADMIN', 'CHEF', 'DIRECTEUR', 'INSTRUCTEUR'].includes(role || '')
  const { data: relances } = useQuery({
    queryKey: ['reclamations-relances'],
    queryFn: () => api.get('/api/v1/reclamations/a-relancer', { params: { jours: 15 } }).then((r) => r.data),
    enabled: showRelances,
  })

  if (isLoading) {
    return <SkeletonCards count={4} />
  }

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrateur',
    DIRECTEUR: 'Directeur',
    CHEF: 'Chef de service',
    INSTRUCTEUR: 'Instructeur',
    SAISIE: 'Agent de saisie',
  }

  const roleSubtitles: Record<string, string> = {
    ADMIN: 'Vue globale de l\'ensemble des activités de la plateforme.',
    DIRECTEUR: 'Pilotage stratégique et visa des décisions finales.',
    CHEF: 'Validation des décisions et suivi de la file de traitement.',
    INSTRUCTEUR: 'Instruction des dossiers et rédaction des projets de décision.',
    SAISIE: 'Enregistrement et qualification des nouvelles réclamations.',
  }

  const roleIcons: Record<string, any> = {
    ADMIN: Briefcase,
    DIRECTEUR: Eye,
    CHEF: ClipboardCheck,
    INSTRUCTEUR: PenTool,
    SAISIE: FileText,
  }

  const RoleIcon = roleIcons[role || ''] || FileText

  // KPI cards selon le rôle
  const baseCards = [
    { label: 'Total réclamations', value: stats?.total || 0, icon: FileText, gradient: 'from-brand-500 to-indigo-600', glow: 'shadow-brand-500/30', hint: 'Dépôts enregistrés' },
  ]

  const roleCards: Record<string, any[]> = {
    SAISIE: [
      ...baseCards,
      { label: 'À qualifier', value: (stats?.par_statut?.A_QUALIFIER || 0), icon: AlertTriangle, gradient: 'from-amber-500 to-amber-600', glow: 'shadow-amber-500/30', total: stats?.total || 0 },
      { label: 'En instruction', value: (stats?.par_statut?.EN_INSTRUCTION || 0), icon: Clock, gradient: 'from-brand-500 to-indigo-600', glow: 'shadow-brand-500/30', total: stats?.total || 0 },
      { label: 'Clôturées', value: (stats?.par_statut?.CLOTUREE || 0), icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/30', total: stats?.total || 0 },
    ],
    INSTRUCTEUR: [
      ...baseCards,
      { label: 'À instruire', value: (stats?.par_statut?.EN_INSTRUCTION || 0) + (stats?.par_statut?.EN_ATTENTE_PIECES || 0) + (stats?.par_statut?.PROJET_REPONSE || 0), icon: PenTool, gradient: 'from-brand-500 to-indigo-600', glow: 'shadow-brand-500/30', total: stats?.total || 0 },
      { label: 'En validation', value: (stats?.par_statut?.EN_VALIDATION || 0), icon: ClipboardCheck, gradient: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/30', total: stats?.total || 0 },
      { label: 'En retard', value: stats?.en_retard || 0, icon: AlertTriangle, gradient: 'from-amber-500 to-amber-700', glow: 'shadow-amber-500/30', total: stats?.total || 0 },
    ],
    CHEF: [
      ...baseCards,
      { label: 'À valider', value: (stats?.par_statut?.EN_VALIDATION || 0), icon: ClipboardCheck, gradient: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/30', total: stats?.total || 0 },
      { label: 'En cours', value: stats?.en_cours || 0, icon: Clock, gradient: 'from-amber-500 to-amber-600', glow: 'shadow-amber-500/30', total: stats?.total || 0 },
      { label: 'En retard', value: stats?.en_retard || 0, icon: AlertTriangle, gradient: 'from-amber-500 to-amber-700', glow: 'shadow-amber-500/30', total: stats?.total || 0 },
    ],
    DIRECTEUR: [
      ...baseCards,
      { label: 'Visa directeur', value: (stats?.par_statut?.EN_VISA_DIRECTEUR || 0), icon: Eye, gradient: 'from-brand-500 to-brand-600', glow: 'shadow-brand-500/30', total: stats?.total || 0 },
      { label: 'En cours', value: stats?.en_cours || 0, icon: Clock, gradient: 'from-amber-500 to-amber-600', glow: 'shadow-amber-500/30', total: stats?.total || 0 },
      { label: 'Délai moyen', value: stats?.delai_moyen_jours || 0, suffix: ' j', icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/30', hint: 'Traitement dans les délais' },
    ],
    ADMIN: [
      { label: 'En cours', value: stats?.en_cours || 0, icon: Clock, gradient: 'from-amber-500 to-amber-600', glow: 'shadow-amber-500/30', total: stats?.total || 0 },
      { label: 'En retard', value: stats?.en_retard || 0, icon: AlertTriangle, gradient: 'from-amber-500 to-amber-700', glow: 'shadow-amber-500/30', total: stats?.total || 0 },
      { label: 'Délai moyen', value: stats?.delai_moyen_jours || 0, suffix: ' j', icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/30', hint: 'Traitement dans les délais' },
      { label: 'Notifiées', value: (stats?.par_statut?.NOTIFIEE || 0), icon: TrendingUp, gradient: 'from-brand-500 to-brand-600', glow: 'shadow-brand-500/30', total: stats?.total || 0 },
    ],
  }

  const cards = roleCards[role || ''] || roleCards.ADMIN

  // Charts
  const statutLabels = Object.keys(stats?.par_statut || {})
  const statutValues = Object.values(stats?.par_statut || {})
  const statutData = {
    labels: statutLabels.map((s) => s.replace(/_/g, ' ')),
    datasets: [{
      data: statutValues as number[],
      backgroundColor: statutLabels.map((s) => (STATUT_COLORS[s] || '#94a3b8') + '20'),
      borderColor: statutLabels.map((s) => STATUT_COLORS[s] || '#94a3b8'),
      borderWidth: 2,
      borderRadius: 10,
      borderSkipped: false,
      barThickness: 24,
    }],
  }

  const typeLabels = (stats?.par_type || []).map((t: any) => t.libelle)
  const typeValues = (stats?.par_type || []).map((t: any) => t.total)
  const typeData = {
    labels: typeLabels,
    datasets: [{
      data: typeValues as number[],
      backgroundColor: TYPE_COLORS.slice(0, typeLabels.length).map(c => c + 'DD'),
      borderWidth: 3,
      borderColor: chartSegmentBorder,
      hoverOffset: 10,
    }],
  }

  const moisLabels = (stats?.par_mois || []).map((m: any) => {
    const [y, mo] = m.mois.split('-')
    return `${mo}/${y.slice(2)}`
  })
  const moisValues = (stats?.par_mois || []).map((m: any) => m.total)
  const moisData = {
    labels: moisLabels,
    datasets: [{
      data: moisValues as number[],
      borderColor: '#6366f1',
      backgroundColor: (ctx: any) => {
        const gradient = ctx.chart?.ctx?.createLinearGradient(0, 0, 0, 256)
        if (gradient) {
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)')
          gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.05)')
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0)')
        }
        return gradient || 'rgba(99, 102, 241, 0.1)'
      },
      fill: true,
      tension: 0.45,
      pointRadius: 5,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: chartSegmentBorder,
      pointBorderWidth: 3,
      pointHoverRadius: 8,
      pointHoverBorderWidth: 3,
      pointHoverBackgroundColor: '#4f46e5',
      borderWidth: 3,
    }],
  }

  const chartTooltipStyle = {
    backgroundColor: '#0f172a',
    titleFont: { family: 'Inter', size: 13, weight: '600' as const },
    bodyFont: { family: 'Inter', size: 12 },
    padding: 14,
    cornerRadius: 12,
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    displayColors: true,
    boxPadding: 4,
  }

  return (
    <div className="space-y-8">
      {/* Hero Header — personnalisé par rôle */}
      <PageHero
        kicker={roleLabels[role || ''] || 'Tableau de bord'}
        icon={<RoleIcon size={16} className="text-brand-200" />}
        title={<>Bonjour, {user?.nom?.split(' ')[0]}</>}
        subtitle={
          <>
            {roleSubtitles[role || ''] || ''}
            {stats?.en_retard > 0 && (
              <span className="text-amber-300 font-semibold"> {stats.en_retard} réclamation{stats.en_retard > 1 ? 's' : ''} en retard.</span>
            )}
          </>
        }
        actions={
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-white/80">{roleLabels[role || '']}</span>
          </div>
        }
      />

      {/* Stat Cards with staggered animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <AnimatedStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            suffix={card.suffix}
            icon={card.icon}
            gradient={card.gradient}
            glow={card.glow}
            total={card.total}
            hint={card.hint}
            delay={i * 100}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 group hover:-translate-y-1.5 hover:shadow-card-hover" style={{ animation: 'slideUp 0.6s ease-out 0.3s backwards' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <BarChart3 size={16} className="text-brand-600" />
            </div>
            <h2 className="section-title">Par statut</h2>
          </div>
          <div className="h-64">
            <Bar data={statutData} options={{ responsive: true, maintainAspectRatio: false, animation: { duration: 1000, easing: 'easeOutQuart' }, plugins: { legend: { display: false }, tooltip: chartTooltipStyle as any }, scales: { x: { ticks: { font: { size: 8, family: 'Inter' }, maxRotation: 50, color: chartTick }, grid: { display: false }, border: { display: false } }, y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11, family: 'Inter' }, color: chartTick }, grid: { color: chartGrid }, border: { display: false } } } }} />
          </div>
        </div>

        <div className="card p-6 group hover:-translate-y-1.5 hover:shadow-card-hover" style={{ animation: 'slideUp 0.6s ease-out 0.4s backwards' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-amber-600" />
            </div>
            <h2 className="section-title">Par type</h2>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={typeData} options={{ responsive: true, maintainAspectRatio: false, cutout: '68%', animation: { animateRotate: true, duration: 1200 }, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14, font: { size: 11, family: 'Inter' }, usePointStyle: true, pointStyle: 'circle', color: chartLegendColor } }, tooltip: chartTooltipStyle as any } }} />
          </div>
        </div>

        <div className="card p-6 group hover:-translate-y-1.5 hover:shadow-card-hover" style={{ animation: 'slideUp 0.6s ease-out 0.5s backwards' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Activity size={16} className="text-emerald-600" />
            </div>
            <h2 className="section-title">Évolution mensuelle</h2>
          </div>
          <div className="h-64">
            <Line data={moisData} options={{ responsive: true, maintainAspectRatio: false, animation: { duration: 1200, easing: 'easeOutQuart' }, plugins: { legend: { display: false }, tooltip: chartTooltipStyle as any }, scales: { x: { grid: { display: false }, ticks: { font: { size: 11, family: 'Inter' }, color: chartTick }, border: { display: false } }, y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11, family: 'Inter' }, color: chartTick }, grid: { color: chartGrid }, border: { display: false } } } }} />
          </div>
        </div>
      </div>

      {/* Agent Activity */}
      {showAgent && (stats?.par_agent || []).length > 0 && (
        <div className="card p-6 hover:-translate-y-1.5 hover:shadow-card-hover" style={{ animation: 'slideUp 0.6s ease-out 0.6s backwards' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <Users size={16} className="text-brand-600" />
            </div>
            <h2 className="section-title">Activité par agent</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.par_agent.map((a: any, i: number) => {
              const maxTraitees = Math.max(...stats.par_agent.map((x: any) => x.traitees || 1))
              const pct = Math.round(((a.traitees || 0) / maxTraitees) * 100)
              return (
                <div
                  key={a.nom}
                  className="group relative bg-gradient-to-br from-surface-50 to-surface-50 rounded-2xl p-5 text-center border border-surface-100 hover:border-brand-200 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5"
                  style={{ animation: 'slideUp 0.5s ease-out backwards', animationDelay: `${0.7 + i * 0.08}s` }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-brand-500/20 mx-auto group-hover:scale-110 group-hover:shadow-brand-500/30 transition-all duration-300">
                    {a.nom?.charAt(0) || '?'}
                  </div>
                  <p className="text-3xl font-extrabold text-surface-900 mt-3 tracking-tighter">
                    <CountUpInline value={a.traitees || 0} />
                  </p>
                  <p className="text-xs font-medium text-surface-500 mt-1 truncate">{a.nom}</p>
                  <div className="mt-3 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${pct}%`, transitionDelay: `${0.8 + i * 0.1}s` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Dernières réclamations — en cartes */}
      <div className="card overflow-hidden hover:-translate-y-1.5 hover:shadow-card-hover" style={{ animation: 'slideUp 0.6s ease-out 0.7s backwards' }}>
        <div className="p-6 border-b border-surface-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <FileText size={16} className="text-brand-600" />
            </div>
            <h2 className="section-title">Dernières réclamations</h2>
          </div>
          <a href="/reclamations" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1">
            Voir tout <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {derniers?.items?.map((r: any, i: number) => (
            <div
              key={r.id}
              onClick={() => navigate(`/reclamations/${r.id}`)}
              className="group p-4 rounded-2xl border border-surface-100 hover:border-brand-200 hover:shadow-card-hover cursor-pointer transition-all duration-300 hover:-translate-y-1.5"
              style={{ animation: 'slideUp 0.4s ease-out backwards', animationDelay: `${0.8 + i * 0.06}s` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Hash size={12} className="text-brand-400" />
                  <span className="font-mono text-xs font-bold text-brand-600 group-hover:text-brand-700 transition-colors">{r.numero_dossier}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUT_BADGE[r.statut] || 'bg-surface-100 text-surface-600'}`}>
                  {STATUT_FR[r.statut] || r.statut}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-surface-400">
                <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(r.date_depot).toLocaleDateString('fr-FR')}</span>
                {r.montant_concerne && (
                  <span className="font-semibold text-surface-700 tabular-nums">{Number(r.montant_concerne).toLocaleString()} Ar</span>
                )}
              </div>
              <div className="mt-3 h-[2px] rounded-full bg-gradient-to-r from-brand-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </div>

      {/* Échéances proches — relances */}
      {showRelances && (relances?.items || []).length > 0 && (
        <div className="card overflow-hidden hover:-translate-y-1.5 hover:shadow-card-hover" style={{ animation: 'slideUp 0.6s ease-out 0.8s backwards' }}>
          <div className="p-6 border-b border-surface-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <CalendarClock size={16} className="text-amber-600" />
              </div>
              <h2 className="section-title">Échéances proches — à relancer</h2>
            </div>
            <span className="text-xs font-semibold text-surface-400">Horizon : {relances.horizon_jours || 15} jours</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-surface-400 border-b border-surface-100">
                  <th className="px-6 py-3 font-semibold">Dossier</th>
                  <th className="px-6 py-3 font-semibold">Contribuable</th>
                  <th className="px-6 py-3 font-semibold">Statut</th>
                  <th className="px-6 py-3 font-semibold">Limite</th>
                  <th className="px-6 py-3 font-semibold">Relance</th>
                  <th className="px-6 py-3 font-semibold">Instructeur</th>
                </tr>
              </thead>
              <tbody>
                {(relances?.items || []).map((r: any) => {
                  const retard = r.en_retard
                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/reclamations/${r.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigate(`/reclamations/${r.id}`)
                        }
                      }}
                      role="link"
                      tabIndex={0}
                      aria-label={`Ouvrir le dossier ${r.numero_dossier}`}
                      className="border-b border-surface-100 last:border-0 hover:bg-surface-50 dark:hover:bg-slate-800/40 focus-visible:bg-surface-50 dark:focus-visible:bg-slate-800/40 focus-visible:outline-none cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-xs font-bold text-brand-600">{r.numero_dossier}</span>
                        <p className="text-[11px] text-surface-400 mt-0.5">{r.reference_imposition || '—'}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="font-medium text-surface-800">{r.contribuable?.nom_raison_sociale || '—'}</p>
                        <p className="text-[11px] text-surface-400">{r.contribuable?.numero_fiscal || ''}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUT_BADGE[r.statut] || 'bg-surface-100 text-surface-600'}`}>
                          {STATUT_FR[r.statut] || r.statut}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-surface-600">
                        {r.date_limite_reponse ? new Date(r.date_limite_reponse).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-6 py-3.5">
                        {retard ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                            <AlertTriangle size={12} /> {Math.abs(r.jours_restants)} j de retard
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                            <Clock size={12} /> dans {r.jours_restants} j
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-surface-600">{r.instructeur_actuel?.nom || 'non affecté'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function CountUpInline({ value }: { value: number }) {
  const v = useCountUp(value, 800)
  return <>{v}</>
}
