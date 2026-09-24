import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import {
  ArrowRight, Menu, X, FileText, ClipboardCheck, Microscope, Scale,
  Stethoscope, PenLine, Bell, BarChart3, ShieldCheck, Clock, Users,
  Database, Upload, CheckCircle2, Zap, Lock, Layers, Workflow,
  ChevronRight, Sparkles, Landmark, GraduationCap, TrendingUp, Award, Search,
} from 'lucide-react'
import logo from '@/assets/logo.jpg'

/* ===== Hooks : compteur animé + révélations au scroll ===== */

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(34px)',
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

function CountUp({ target, suffix = '', prefix = '', duration = 1500 }: { target: number; suffix?: string; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [started, setStarted] = useState(false)
  const [val, setVal] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStarted(true)
          obs.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(eased * target * 10) / 10)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, target, duration])

  return (
    <p ref={ref} className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-300 tabular-nums" style={{ backgroundSize: '200% auto', animation: 'gradientShift 6s ease infinite' }}>
      {prefix}{val}{suffix}
    </p>
  )
}

/* ===== Données ===== */

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Technologies', href: '#tech' },
  { label: 'À propos', href: '#about' },
]

const FEATURES = [
  {
    icon: FileText,
    title: 'Enregistrement des réclamations',
    desc: 'Capture complète des réclamations contentieuses, gracieuses et de prescription avec pièces jointes et accusé de réception.',
    color: 'from-brand-500 to-brand-600',
  },
  {
    icon: ClipboardCheck,
    title: 'Qualification & instruction',
    desc: 'Qualification précise, instruction détaillée et proposition de décision conforme au cadre réglementaire malgache.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Scale,
    title: 'Décision & validation',
    desc: 'Circuit de validation à deux niveaux : le chef de service valide, le directeur engage la décision finale.',
    color: 'from-amber-500 to-amber-600',
  },
  {
    icon: Bell,
    title: 'Notifications & suivi',
    desc: 'Notification automatique des décisions et suivi en temps réel des délais de traitement et des retards.',
    color: 'from-brand-600 to-brand-700',
  },
  {
    icon: BarChart3,
    title: 'Tableau de bord analytique',
    desc: 'Statistiques dynamiques : statuts, types, canaux, délais moyens, performance des agents et alertes de retard.',
    color: 'from-amber-600 to-amber-700',
  },
  {
    icon: ShieldCheck,
    title: 'Sécurité & traçabilité',
    desc: 'Contrôle d\'accès par rôles, historique complet des actions et signature électronique des décisions.',
    color: 'from-emerald-600 to-emerald-700',
  },
]

const WORKFLOW_STEPS = [
  {
    icon: PenLine,
    step: '01',
    title: 'Saisie',
    desc: 'L\'agent enregistre la réclamation du contribuable et téléverse les pièces justificatives.',
    accent: 'from-brand-500 to-brand-600',
  },
  {
    icon: Microscope,
    step: '02',
    title: 'Qualification',
    desc: 'La réclamation est qualifiée selon son type et son fondement juridique.',
    accent: 'from-amber-500 to-amber-600',
  },
  {
    icon: Stethoscope,
    step: '03',
    title: 'Instruction',
    desc: 'Instruction approfondie du dossier et rédaction de la proposition de décision.',
    accent: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Scale,
    step: '04',
    title: 'Décision',
    desc: 'Le chef de service émet une décision motivée.',
    accent: 'from-amber-600 to-amber-700',
  },
  {
    icon: ShieldCheck,
    step: '05',
    title: 'Validation',
    desc: 'Validation par le chef de service puis visa du directeur.',
    accent: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Bell,
    step: '06',
    title: 'Notification',
    desc: 'Notification de la décision au contribuable et clôture du dossier.',
    accent: 'from-brand-600 to-brand-700',
  },
]

const TECH_STACK = [
  { icon: Layers, name: 'FastAPI', role: 'Backend' },
  { icon: Zap, name: 'React', role: 'Frontend' },
  { icon: Database, name: 'PostgreSQL', role: 'Base de données' },
  { icon: Upload, name: 'MinIO', role: 'Stockage fichiers' },
  { icon: Workflow, name: 'Celery', role: 'Tâches asynchrones' },
  { icon: Lock, name: 'JWT', role: 'Authentification' },
]

const STATS = [
  { target: 0.6, label: 'Délai moyen de traitement', prefix: '<', suffix: ' mois' },
  { target: 60, label: 'Jours de délai légal', suffix: ' j' },
  { target: 6, label: 'Étapes de workflow', suffix: '' },
  { target: 5, label: 'Rôles métier', suffix: '' },
]

const FLOATING_CHIPS = [
  { icon: CheckCircle2, text: 'Décision signée et notifiée', color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-500/10 border-emerald-400/20', pos: 'top-[12%] -left-6 lg:left-2', delay: '0s', float: 'meshFloat1' },
  { icon: TrendingUp, text: 'Efficacité +24%', color: 'text-brand-300', bg: 'from-brand-500/20 to-brand-600/10 border-brand-400/20', pos: 'top-[48%] -right-8 lg:-right-4', delay: '1.6s', float: 'meshFloat2' },
  { icon: ShieldCheck, text: 'RGPD & traçabilité totale', color: 'text-brand-300', bg: 'from-brand-500/20 to-brand-600/10 border-brand-400/20', pos: 'bottom-[10%] left-0 lg:left-6', delay: '0.9s', float: 'meshFloat3' },
  { icon: Award, text: 'Délais légaux respectés', color: 'text-amber-300', bg: 'from-amber-500/20 to-amber-600/10 border-amber-400/20', pos: 'bottom-[30%] -right-16 lg:-right-8', delay: '2.4s', float: 'meshFloat1' },
]

/* ===== Composant ===== */

export default function Landing() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const goTo = () => navigate(isAuthenticated ? '/app' : '/login')

  return (
    <div className="min-h-screen bg-[#070b17] text-white overflow-x-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-brand-600/20 rounded-full blur-[120px]" style={{ animation: 'meshFloat1 14s ease-in-out infinite' }} />
        <div className="absolute top-1/3 -right-40 w-[480px] h-[480px] bg-brand-600/20 rounded-full blur-[120px]" style={{ animation: 'meshFloat2 18s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-brand-600/10 rounded-full blur-[120px]" style={{ animation: 'meshFloat3 16s ease-in-out infinite' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #818cf8 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl px-5 py-3 shadow-glow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-lg shadow-brand-500/20">
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="leading-tight">
                <p className="font-extrabold text-[15px] tracking-tight">
                  <span className="bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent">Reclamations</span>
                  <span className="text-white">.MG</span>
                </p>
                <p className="text-[9px] text-surface-400 tracking-[0.2em] uppercase">DGI Madagascar</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className="px-4 py-2 text-sm text-surface-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                  {l.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/suivi"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Search size={14} />
                Suivre une réclamation
              </Link>
              <a
                href="#cta"
                className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-sm font-semibold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                Accéder à la plateforme
                <ArrowRight size={15} />
              </a>
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg bg-white/5 text-surface-300 hover:text-white transition-colors">
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden mx-auto max-w-7xl px-4 mt-2">
            <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl p-4" style={{ animation: 'slideUp 0.3s ease-out' }}>
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm text-surface-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                  {l.label}
                </a>
              ))}
              <Link
                to="/suivi"
                onClick={() => setMenuOpen(false)}
                className="mt-3 w-full flex justify-center py-3 rounded-xl border border-white/10 bg-white/5 text-[11px] text-xs font-semibold"
              >
                <Search size={14} className="mr-2" />
                Suivre une réclamation
              </Link>
              <button onClick={goTo} className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-sm font-semibold">
                Accéder à la plateforme
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative pt-40 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          {/* Chips flottantes décoratives */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none">
            {FLOATING_CHIPS.map((c, i) => (
              <div
                key={i}
                className={`absolute ${c.pos} inline-flex items-center gap-2.5 rounded-2xl border px-4 py-3 backdrop-blur-xl bg-gradient-to-r ${c.bg} shadow-2xl`}
                style={{ animation: `${c.float} 7s ease-in-out ${c.delay} infinite` }}
              >
                <div className={`flex items-center gap-2.5 ${c.color}`} style={{ animation: 'pulseSoft 2.6s ease-in-out infinite' }}>
                  <c.icon size={18} />
                  <span className="text-xs font-bold text-white/90 whitespace-nowrap">{c.text}</span>
                </div>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 mb-8">
                <Sparkles size={14} className="text-brand-400" style={{ animation: 'pulseSoft 2s ease-in-out infinite' }} />
                <span className="text-xs font-semibold text-brand-300 tracking-wide">Plateforme officielle de la Direction Générale des Impôts</span>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
                Gérez les réclamations
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-300" style={{ backgroundSize: '200% auto', animation: 'gradientShift 5s ease infinite', display: 'inline-block' }}>
                  des contribuables
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="max-w-2xl mx-auto text-lg text-surface-400 mb-10 leading-relaxed">
                Une plateforme complète de gestion, de traitement et de suivi des réclamations fiscales —
                du dépôt jusqu'à la notification, avec une traçabilité totale et conforme au cadre juridique malgache.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <button
                  onClick={goTo}
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-base font-bold shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-1 transition-all duration-300"
                >
                  {isAuthenticated ? 'Ouvrir le tableau de bord' : 'Accéder à la plateforme'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                <a href="#workflow" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-base font-semibold hover:-translate-y-1 transition-all duration-300">
                  Découvrir le workflow
                  <ChevronRight size={18} />
                </a>
              </div>
            </Reveal>

            {/* Stats animées */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {STATS.map((s, i) => (
                <Reveal key={s.label} delay={0.4 + i * 0.1}>
                  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 hover:bg-white/[0.06] hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CountUp target={s.target} suffix={s.suffix} prefix={s.prefix || ''} />
                    <p className="text-xs text-surface-400 font-medium mt-2">{s.label}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm font-bold text-brand-400 mb-3 tracking-widest uppercase">Fonctionnalités</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Tout le cycle de vie d'une réclamation</h2>
              <p className="text-surface-400">Du premier dépôt à la notification finale, chaque étape est digitalisée et maîtrisée.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.08}>
                <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 hover:bg-white/[0.06] hover:border-brand-500/30 hover:-translate-y-1.5 transition-all duration-300">
                  <div className="absolute -top-16 -right-16 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Shine */}
                  <div className="absolute -top-full left-0 w-1/2 h-[300%] rotate-12 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent group-hover:translate-y-full transition-transform duration-1000" />
                  <div className={`inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon size={22} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-surface-400 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WORKFLOW (frise chronologique animée) ===== */}
      <section id="workflow" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm font-bold text-brand-400 mb-3 tracking-widest uppercase">Le workflow</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Un circuit de décision transparent</h2>
              <p className="text-surface-400">Six étapes claires, pilotées par des rôles métier et validées à chaque niveau.</p>
            </div>
          </Reveal>

          <WorkflowTimeline />
        </div>
      </section>

      {/* ===== TECH STACK ===== */}
      <section id="tech" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm font-bold text-brand-400 mb-3 tracking-widest uppercase">Technologies</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Une stack moderne et robuste</h2>
              <p className="text-surface-400">Construite avec des technologies éprouvées pour la performance et la sécurité.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {TECH_STACK.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.06}>
                <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center hover:bg-white/[0.06] hover:-translate-y-1 hover:border-brand-500/30 transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="inline-flex p-3 rounded-xl bg-brand-500/10 group-hover:bg-brand-500/20 group-hover:scale-110 transition-all duration-300">
                    <t.icon size={26} className="text-brand-400" />
                  </div>
                  <p className="font-bold text-sm mt-3">{t.name}</p>
                  <p className="text-[11px] text-surface-500 mt-0.5">{t.role}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section id="about" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Reveal>
                <p className="text-sm font-bold text-brand-400 mb-3 tracking-widest uppercase">À propos</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">Direction Générale des Impôts</h2>
                <p className="text-surface-400 leading-relaxed mb-6">
                  Plateforme de gestion et de suivi des réclamations des contribuables,
                  conçue pour moderniser et digitaliser le traitement des dossiers fiscaux.
                </p>
              </Reveal>
              <div className="space-y-3 mb-8">
                {[
                  { icon: Landmark, text: 'Alignée sur le cadre réglementaire malgache' },
                  { icon: Users, text: 'Cinq rôles métier : administrateur, saisie, instruction, chef, directeur' },
                  { icon: Clock, text: 'Suivi des délais légaux de traitement et alertes de retard' },
                  { icon: CheckCircle2, text: 'Export Excel, CSV et tableaux de bord analytiques' },
                ].map((item, i) => (
                  <Reveal key={i} delay={i * 0.07}>
                    <div className="group flex items-start gap-3 rounded-xl px-3 py-2 hover:bg-white/[0.03] transition-colors">
                      <div className="p-1.5 rounded-lg bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors">
                        <item.icon size={16} className="text-brand-400 mt-0" />
                      </div>
                      <span className="text-sm text-surface-300 pt-1">{item.text}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal>
                <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 hover:bg-white/[0.06] hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                    <GraduationCap size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Gestion intégrée</p>
                    <p className="text-xs text-surface-500">Traitement rapide, transparent et traçable</p>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Mockup flottant */}
            <Reveal delay={0.15}>
              <div className="relative" style={{ animation: 'meshFloat2 7s ease-in-out infinite' }}>
                <div className="absolute -inset-8 bg-gradient-to-br from-brand-600/20 to-brand-600/20 rounded-[3rem] blur-3xl" />
                <div className="relative rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 overflow-hidden shadow-elevated">
                  <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
                  <div className="flex items-center gap-1.5 mb-5">
                    <div className="w-3 h-3 rounded-full bg-brand-500/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                    <div className="ml-3 flex-1 h-6 bg-white/5 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { l: 'Total', v: 142, c: 'text-brand-400', d: 0.2 },
                      { l: 'En cours', v: 38, c: 'text-amber-400', d: 0.4 },
                      { l: 'Clôturées', v: 96, c: 'text-emerald-400', d: 0.6 },
                      { l: 'Délai moy.', v: 4.2, c: 'text-brand-400', d: 0.8 },
                    ].map((k) => (
                      <div key={k.l} className="bg-white/[0.04] rounded-xl p-4 hover:bg-white/[0.07] transition-colors">
                        <p className="text-[10px] text-surface-500 uppercase tracking-wider mb-1">{k.l}</p>
                        <p className={`text-2xl font-extrabold tabular-nums ${k.c}`}>
                          <MiniCount target={k.v} delay={k.d} />
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/[0.04] rounded-xl p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] text-surface-400 font-semibold uppercase tracking-wider">Performance du traitement</span>
                      <span className="text-[10px] text-emerald-400 font-bold" style={{ animation: 'pulseSoft 2s ease-in-out infinite' }}>+24%</span>
                    </div>
                    <div className="space-y-2.5 mt-4">
                      {[{ l: 'Taux de clôture', w: '82%' }, { l: 'Respect des délais', w: '91%' }, { l: 'Satisfaction', w: '96%' }].map((p) => (
                        <div key={p.l}>
                          <div className="flex justify-between text-[10px] text-surface-400 mb-1"><span>{p.l}</span><span>{p.w}</span></div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="relative h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full" style={{ width: p.w, animation: 'scaleIn 1s ease-out' }}>
                              <div className="absolute top-0 bottom-0 right-0 w-2 bg-white/40 rounded-full" style={{ animation: 'pulseSoft 1.6s ease-in-out infinite' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section id="cta" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="relative rounded-[2.5rem] border border-brand-500/20 bg-gradient-to-br from-brand-600/20 via-brand-600/15 to-brand-600/20 p-12 sm:p-16 text-center overflow-hidden" style={{ animation: 'scaleIn 0.7s ease-out' }}>
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl" style={{ animation: 'meshFloat1 12s ease-in-out infinite' }} />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl" style={{ animation: 'meshFloat2 14s ease-in-out infinite' }} />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
              <Sparkles size={40} className="mx-auto text-brand-400 mb-6" style={{ animation: 'pulseSoft 2.5s ease-in-out infinite' }} />
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Prêt à moderniser le traitement des réclamations ?</h2>
              <p className="text-surface-400 max-w-xl mx-auto mb-8">
                Accédez à la plateforme de gestion et de suivi des réclamations des contribuables.
              </p>
              <button onClick={goTo} className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-surface-900 hover:bg-surface-100 text-base font-bold hover:-translate-y-1 transition-all duration-300 shadow-xl">
                {isAuthenticated ? 'Ouvrir la plateforme' : 'Se connecter'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative border-t border-white/10 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-white/15">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-semibold">Plateforme de Gestion des Réclamations</span>
          </div>
          <p className="text-xs text-surface-500">© {new Date().getFullYear()} — DGI Madagascar</p>
        </div>
      </footer>
    </div>
  )
}

/* ===== Sous-composants ===== */

function MiniCount({ target, delay = 0 }: { target: number; delay?: number }) {
  const [val, setVal] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setTimeout(() => setStarted(true), delay * 1000)
        obs.disconnect()
      }
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])

  useEffect(() => {
    if (!started) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 1200, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(eased * target * 10) / 10)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, target])

  return <span ref={ref}>{val}</span>
}

function WorkflowTimeline() {
  const ref = useRef<HTMLDivElement>(null)
  const [draw, setDraw] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setDraw(true)
          obs.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="relative">
      {/* Ligne verticale lumineuse */}
      <div className="absolute left-[26px] sm:left-1/2 sm:-translate-x-1/2 top-2 bottom-2 w-[3px] rounded-full bg-white/[0.06]" />
      <div
        className="absolute left-[26px] sm:left-1/2 sm:-translate-x-1/2 top-2 w-[3px] rounded-full bg-gradient-to-b from-brand-400 via-brand-500 to-brand-300 shadow-[0_0_16px_rgba(129,140,248,0.7)]"
        style={{ height: draw ? 'calc(100% - 16px)' : '0%', transition: 'height 1.6s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <span className="absolute -bottom-1 -right-[3px] w-2.5 h-2.5 rounded-full bg-brand-300" style={{ boxShadow: '0 0 18px rgba(129,140,248,1)' }} />
      </div>

      <div className="space-y-8">
        {WORKFLOW_STEPS.map((s, i) => {
          const left = i % 2 === 0
          return (
            <Reveal key={s.step} delay={0.1 + i * 0.1}>
              <div className={`relative flex items-start gap-6 sm:gap-0 pl-14 sm:pl-0 ${left ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                {/* Pastille centrale */}
                <div className="absolute left-[14px] sm:left-1/2 sm:-translate-x-1/2 top-4 z-10">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-2xl bg-gradient-to-br ${s.accent} flex items-center justify-center shadow-lg ring-4 ring-[#070b17]`}>
                    <s.icon size={15} className="text-white" />
                  </div>
                </div>

                {/* Carte */}
                <div className={`group relative w-full sm:w-[calc(50%-3rem)] rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] hover:border-brand-500/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden ${left ? '' : ''}`}>
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-brand-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-black tracking-widest bg-gradient-to-r ${s.accent} bg-clip-text text-transparent`}>{s.step}</span>
                    <h3 className="text-lg font-bold">{s.title}</h3>
                  </div>
                  <p className="text-sm text-surface-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}