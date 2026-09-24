import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { Lock, Mail, AlertCircle, ArrowRight, Shield, Eye, EyeOff, MapPin, Sun, Moon } from 'lucide-react'
import logo from '@/assets/logo.jpg'
import { useThemeStore } from '@/lib/theme'

function AnimatedBar({ delay, height }: { delay: number; height: number }) {
  const [h, setH] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setH(height), delay)
    return () => clearTimeout(t)
  }, [delay, height])
  return <div className="flex-1 rounded-t-sm bg-gradient-to-t from-brand-500/20 to-brand-400/40 transition-all duration-700 ease-out" style={{ height: `${h}%` }} />
}

function AnimatedNumber({ value, delay = 0 }: { value: string; delay?: number }) {
  const numericPart = parseFloat(value) || 0
  const suffix = value.replace(/[\d.]/g, '')
  const [displayed, setDisplayed] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  useEffect(() => {
    if (!started) return
    const duration = 800
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * numericPart * 10) / 10)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [started, numericPart])

  return <>{displayed}{suffix}</>
}

function AnimatedWidth({ width, delay }: { width: string; delay: number }) {
  const [w, setW] = useState('0%')
  useEffect(() => {
    const t = setTimeout(() => setW(width), delay)
    return () => clearTimeout(t)
  }, [delay, width])
  return <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: w }} />
}

const LIEU_PHRASES = [
  'DGI - Region Fitovinany Manakara',
  'Direction Regionale des Impots de Manakara',
  'Plateforme de suivi des reclamations fiscales',
]

function LocationBanner() {
  const [idx, setIdx] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const duration = 3600
    setProgress(0)
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setProgress(p)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const iv = setInterval(() => setIdx((i) => (i + 1) % LIEU_PHRASES.length), duration)
    return () => { clearInterval(iv); cancelAnimationFrame(raf) }
  }, [idx])

  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 w-max max-w-[96%]">
      {/* Halo lumineux flottant derriere */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-brand-500/30 via-brand-500/25 to-brand-600/30 blur-2xl" style={{ animation: 'pulseSoft 3.2s ease-in-out infinite' }} />

      {/* Corps du bandeau */}
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#0b1024]/90 backdrop-blur-xl shadow-2xl shadow-brand-500/25" style={{ animation: 'meshFloat2 6s ease-in-out infinite' }}>
        {/* Liseré haut animé */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-300 to-transparent" style={{ backgroundSize: '200% 100%', animation: 'gradientShift 2.5s ease infinite' }} />

        {/* Fond lumineux interne défilant */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/[0.14] via-transparent to-indigo-500/[0.14]" />
        <div className="absolute -top-full left-0 w-1/2 h-[300%] rotate-12 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" style={{ animation: 'slideUp 4.5s linear infinite' }} />

        {/* Étincelles */}
        {[
          { x: '6%', y: '20%', d: '0s', s: 3, c: 'bg-brand-300/70' },
          { x: '18%', y: '70%', d: '1.4s', s: 2.5, c: 'bg-brand-300/60' },
          { x: '82%', y: '25%', d: '0.8s', s: 3, c: 'bg-indigo-300/70' },
          { x: '95%', y: '60%', d: '2.1s', s: 2, c: 'bg-emerald-300/60' },
        ].map((p, i) => (
          <span key={i} className={`absolute ${p.c} rounded-full`} style={{ left: p.x, top: p.y, width: p.s, height: p.s, animation: `pulseSoft ${i % 2 ? 2.4 : 3}s ease-in-out ${p.d} infinite` }} />
        ))}

        {/* Contenu */}
        <div className="relative flex items-center gap-3.5 pl-4 pr-7 py-3.5">
          {/* Pin animé */}
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 shadow-lg shadow-brand-500/40">
            <MapPin size={17} className="text-white" style={{ animation: 'pulseSoft 2s ease-in-out infinite' }} />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80 animate-ping" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>
          </span>

          <span key={idx} className="relative text-base sm:text-lg lg:text-[19px] font-extrabold tracking-wide whitespace-nowrap bg-gradient-to-r from-brand-300 via-brand-400 to-brand-300 bg-clip-text text-transparent" style={{ backgroundSize: '200% 100%', animation: 'gradientShift 3s ease infinite', textShadow: '0 0 30px rgba(129,140,248,0.35)' }}>
            {LIEU_PHRASES[idx]}
          </span>
          <span className="relative ml-1 text-brand-300/80" style={{ animation: 'pulseSoft 1.4s ease-in-out infinite' }}>▊</span>
        </div>

        {/* Barre de progression lumineuse */}
        <div className="relative h-1.5 w-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-400 shadow-[0_0_12px_rgba(99,102,241,0.8)]" style={{ width: `${progress * 100}%`, transition: 'width 0.06s linear' }} />
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme } = useThemeStore()
  const mockupRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const el = mockupRef.current
    if (!el) return
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 8,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 8,
      })
    }
    el.addEventListener('mousemove', handleMove)
    return () => el.removeEventListener('mousemove', handleMove)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/app')
    } catch {
      setError('Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Top-right actions */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/90 backdrop-blur-md border border-surface-200 shadow-lg dark:bg-slate-800/90 dark:border-slate-700">
          <button
            onClick={() => setTheme('light')}
            title="Mode clair"
            aria-label="Mode clair"
            className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
              theme === 'light'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                : 'text-surface-600 hover:bg-surface-100 dark:text-slate-300 dark:hover:bg-slate-700/60 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            <Sun size={13} />
            Clair
          </button>
          <button
            onClick={() => setTheme('dark')}
            title="Mode sombre"
            aria-label="Mode sombre"
            className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
              theme === 'dark'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                : 'text-surface-600 hover:bg-surface-100 dark:text-slate-300 dark:hover:bg-slate-700/60 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            <Moon size={13} />
            Sombre
          </button>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-surface-200 text-sm font-semibold text-surface-700 shadow-lg hover:bg-white hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 dark:bg-slate-800/90 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <ArrowRight size={15} className="rotate-180" />
          Revenir au site
        </button>
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden bg-[#080b16]">
        {/* Gradient mesh */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[30%] -left-[20%] w-[80%] h-[80%] bg-brand-600/[0.08] rounded-full blur-[140px]" style={{ animation: 'meshFloat1 14s ease-in-out infinite' }} />
          <div className="absolute -bottom-[20%] -right-[15%] w-[70%] h-[70%] bg-indigo-600/[0.06] rounded-full blur-[120px]" style={{ animation: 'meshFloat2 18s ease-in-out infinite' }} />
          <div className="absolute top-[40%] left-[50%] w-[50%] h-[50%] bg-brand-600/[0.04] rounded-full blur-[100px]" style={{ animation: 'meshFloat3 22s ease-in-out infinite' }} />
          <div className="absolute top-[60%] left-[20%] w-[30%] h-[30%] bg-emerald-500/[0.02] rounded-full blur-[80px]" style={{ animation: 'meshFloat1 25s ease-in-out infinite reverse' }} />
        </div>

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'radial-gradient(circle, #fff 0.5px, transparent 0.5px)', backgroundSize: '28px 28px' }} />

        {/* Floating dots */}
        {[
          { x: '12%', y: '8%', s: 2, d: '0s', c: 'bg-brand-400/25' },
          { x: '78%', y: '15%', s: 1.5, d: '1.8s', c: 'bg-brand-400/20' },
          { x: '15%', y: '65%', s: 1.5, d: '0.6s', c: 'bg-indigo-400/20' },
          { x: '85%', y: '50%', s: 2, d: '3s', c: 'bg-brand-300/15' },
          { x: '65%', y: '82%', s: 1.5, d: '2.2s', c: 'bg-emerald-400/15' },
          { x: '5%', y: '35%', s: 1, d: '4s', c: 'bg-emerald-400/15' },
          { x: '92%', y: '75%', s: 1, d: '1.2s', c: 'bg-amber-400/12' },
        ].map((d, i) => (
          <div key={i} className={`absolute ${d.c} rounded-full animate-pulse`} style={{ left: d.x, top: d.y, width: d.s, height: d.s, animationDelay: d.d, animationDuration: '3s' }} />
        ))}

        {/* Accent lines */}
        <div className="absolute top-0 bottom-0 left-[20%] w-px bg-gradient-to-b from-transparent via-white/[0.025] to-transparent" />
        <div className="absolute top-0 bottom-0 right-[15%] w-px bg-gradient-to-b from-transparent via-white/[0.018] to-transparent" />

        {/* Rings */}
        <div className="absolute top-[6%] right-[8%] w-52 h-52 border border-white/[0.02] rounded-full" style={{ animation: 'spin 60s linear infinite' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-brand-400/30 rounded-full" />
        </div>
        <div className="absolute bottom-[8%] left-[8%] w-36 h-36 border border-white/[0.02] rounded-full" style={{ animation: 'spin 40s linear infinite reverse' }}>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-1 bg-brand-400/20 rounded-full" />
        </div>
        <div className="absolute top-[45%] right-[40%] w-20 h-20 border border-white/[0.015] rounded-full" style={{ animation: 'spin 25s linear infinite' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col w-full px-14 py-10">
          {/* Logo */}
          <div style={{ animation: 'slideUp 0.8s cubic-bezier(0.16,1,0.3,1)' }}>
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl overflow-hidden ring-1 ring-white/[0.08] shadow-xl shadow-brand-500/15">
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-white tracking-tight">Reclamations Fiscales</h1>
                <p className="text-[9px] text-brand-300/40 font-bold tracking-[0.3em] uppercase">DGI Madagascar</p>
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="flex-1 flex flex-col justify-center max-w-xl" style={{ animation: 'slideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.08s backwards' }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/[0.08] border border-brand-500/[0.12] mb-7 w-fit" style={{ animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.12s backwards' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              <span className="text-[10px] font-bold text-brand-300/60 tracking-[0.2em] uppercase">Plateforme officielle</span>
            </div>

            <h2 className="text-[3.2rem] font-extrabold text-white leading-[1.02] tracking-tight mb-6">
              Gerez les
              <br />
              <span className="bg-gradient-to-r from-brand-400 via-brand-500 to-brand-400 bg-clip-text text-transparent" style={{ backgroundSize: '200% 100%', animation: 'gradientShift 4s ease infinite' }}>
                reclamations
              </span>
              <br />
              des contribuables.
            </h2>

            <p className="text-surface-400/50 text-[14px] leading-[1.8] max-w-md mb-10" style={{ animation: 'fadeIn 0.8s ease-out 1.2s backwards' }}>
              Plateforme dediee au traitement rapide et transparent des reclamations.
              Conforme au cadre juridique malgache. Workflow complet, traçabilite totale.
            </p>

{/* Dashboard mockup */}
              <div
                ref={mockupRef}
                className="relative"
                style={{
                  animation: 'slideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.25s backwards',
                  transform: `perspective(1000px) rotateY(${mousePos.x * 0.3}deg) rotateX(${-mousePos.y * 0.3}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
              >
                {/* Glow */}
                <div className="absolute -inset-10 bg-brand-500/[0.04] rounded-3xl blur-3xl" />

                {/* Floating location banner - superpose en haut des statistiques */}
                <LocationBanner />

              <div className="relative bg-white/[0.025] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 overflow-hidden">
                {/* Glow line top */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400/30 to-transparent" />

                {/* Window dots */}
                <div className="flex items-center gap-1.5 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30 hover:bg-amber-500/60 transition-colors cursor-pointer" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-300/30 hover:bg-amber-300/60 transition-colors cursor-pointer" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 hover:bg-emerald-500/60 transition-colors cursor-pointer" />
                  <div className="ml-3 flex-1 h-6 bg-white/[0.03] rounded-lg border border-white/[0.03]" />
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-4 gap-2.5 mb-3">
                  {[
                    { v: '142', l: 'Total', c: 'from-brand-500 to-indigo-500' },
                    { v: '38', l: 'En cours', c: 'from-amber-500 to-amber-600' },
                    { v: '5', l: 'Retard', c: 'from-amber-600 to-amber-700' },
                    { v: '4.2 j', l: 'Delai', c: 'from-emerald-500 to-emerald-600' },
                  ].map((s, i) => (
                    <div
                      key={s.l}
                      className="group/card bg-white/[0.035] hover:bg-white/[0.06] rounded-xl p-3 border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300 cursor-default"
                      style={{ animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) backwards', animationDelay: `${0.4 + i * 0.08}s` }}
                    >
                      <div className={`w-7 h-[3px] rounded-full bg-gradient-to-r ${s.c} mb-2.5 opacity-50 group-hover/card:opacity-80 transition-opacity`} />
                      <p className="text-xl font-extrabold text-white/90 tabular-nums">
                        <AnimatedNumber value={s.v} delay={600 + i * 150} />
                      </p>
                      <p className="text-[9px] text-surface-500/40 font-semibold uppercase tracking-wider mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2 bg-white/[0.03] hover:bg-white/[0.05] rounded-xl p-3 border border-white/[0.04] transition-colors duration-300">
                    <p className="text-[10px] text-surface-400/35 font-semibold uppercase tracking-wider mb-3">Activite mensuelle</p>
                    <div className="flex items-end gap-1.5 h-14">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                        <AnimatedBar key={i} delay={700 + i * 60} height={h} />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                     {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => (
                     <span key={i} className="text-[7px] text-surface-600/30 font-medium">{m}</span>
                     ))}
                    </div>
                  </div>

                  <div className="bg-white/[0.03] hover:bg-white/[0.05] rounded-xl p-3 border border-white/[0.04] transition-colors duration-300">
                    <p className="text-[10px] text-surface-400/35 font-semibold uppercase tracking-wider mb-3">Repartition</p>
                    <div className="space-y-2.5">
                      {[
                        { l: 'Cloturees', w: '72%', c: 'bg-gradient-to-r from-emerald-500/50 to-emerald-400/30' },
                        { l: 'En cours', w: '20%', c: 'bg-gradient-to-r from-brand-500/50 to-brand-400/30' },
                        { l: 'Retard', w: '8%', c: 'bg-gradient-to-r from-amber-500/50 to-amber-400/30' },
                      ].map((s, i) => (
                        <div key={s.l}>
                          <div className="flex justify-between mb-1">
                            <span className="text-[8px] text-surface-500/35 font-medium">{s.l}</span>
                            <span className="text-[8px] text-surface-400/35 font-medium tabular-nums">{s.w}</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                            <AnimatedWidth width={s.w} delay={900 + i * 200} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Glow line bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400/20 to-transparent" />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-8" style={{ animation: 'fadeIn 0.6s ease-out 1s backwards' }}>
            {[
              { v: '24/7', l: 'Disponibilite', g: 'from-brand-400 to-brand-300' },
              { v: '100%', l: 'Traçabilite', g: 'from-indigo-400 to-indigo-300' },
              { v: 'LED', l: 'Conforme', g: 'from-brand-400 to-brand-300' },
            ].map((s, i) => (
              <div key={s.l} className="flex items-center gap-8">
                <div className="group/stat cursor-default">
                  <p className={`text-lg font-extrabold bg-gradient-to-r ${s.g} bg-clip-text text-transparent group-hover/stat:scale-110 transition-transform duration-300 origin-left`}>{s.v}</p>
                  <p className="text-[8px] text-surface-500/35 font-bold uppercase tracking-[0.25em] mt-0.5">{s.l}</p>
                </div>
                {i < 2 && <div className="w-px h-5 bg-white/[0.04]" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Login */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-white via-surface-50 to-brand-50/30 dark:from-slate-900 dark:via-surface-100/60 dark:to-brand-500/10">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-100/40 rounded-full blur-[80px]" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-100/30 rounded-full blur-[60px]" />
        <div className="absolute top-1/3 right-[15%] w-2 h-2 bg-brand-300/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-[15%] w-1.5 h-1.5 bg-indigo-300/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[15%] left-[20%] w-1.5 h-1.5 bg-brand-300/25 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }} />

        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 w-full max-w-[420px] mx-8" style={{ animation: 'scaleIn 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden" style={{ animation: 'slideUp 0.6s ease-out' }}>
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-brand-500/20 ring-2 ring-surface-100">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Glass card */}
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-elevated border border-surface-200/50 p-8 dark:bg-slate-900/85 dark:border-slate-700/60">
            {/* Header */}
            <div className="mb-8" style={{ animation: 'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.05s backwards' }}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/25 mb-4">
                <Shield size={22} className="text-white" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-surface-900 via-brand-600 to-surface-900 bg-clip-text text-transparent" style={{ backgroundSize: '200% auto', animation: 'gradientShift 4s ease infinite' }}>Bienvenue</h2>
              <p className="text-surface-500 mt-1 text-sm" style={{ animation: 'pulseSoft 3s ease-in-out infinite' }}>Entrez vos identifiants pour continuer</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-amber-50 text-amber-700 p-4 rounded-xl mb-6 text-sm border border-amber-100" style={{ animation: 'scaleIn 0.3s ease-out' }}>
                <AlertCircle size={18} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div style={{ animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s backwards' }}>
                <label className="label text-surface-700 font-semibold">Email</label>
                <div className={`relative rounded-xl transition-all duration-300 ${focused === 'email' ? 'ring-4 ring-brand-500/10' : ''}`}>
                  <Mail size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focused === 'email' ? 'text-brand-500' : 'text-surface-400'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused('')}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all duration-300"
                    placeholder="vous@exemple.mg"
                  />
                </div>
              </div>

              <div style={{ animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s backwards' }}>
                <label className="label text-surface-700 font-semibold">Mot de passe</label>
                <div className={`relative rounded-xl transition-all duration-300 ${focused === 'password' ? 'ring-4 ring-brand-500/10' : ''}`}>
                  <Lock size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focused === 'password' ? 'text-brand-500' : 'text-surface-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
                    required
                    className="w-full pl-11 pr-12 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all duration-300"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-all duration-200">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s backwards' }}>
                <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg flex items-center justify-center gap-2 group">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center" style={{ animation: 'fadeIn 0.6s ease-out 0.4s backwards' }}>
            <p className="text-[11px] text-surface-400 flex items-center justify-center gap-1.5">
              <Shield size={11} />
              Securise et conforme au reglement DGI
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
