import type { ReactNode } from 'react'

interface PageHeroProps {
  kicker?: ReactNode
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  tile?: boolean
  titleClassName?: string
  className?: string
}

export default function PageHero({
  kicker,
  icon,
  title,
  subtitle,
  actions,
  tile = false,
  titleClassName = '',
  className = '',
}: PageHeroProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-6 sm:p-8 text-white ${className}`}
      style={{ animation: 'slideUp 0.5s ease-out' }}
    >
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-brand-400/20 rounded-full blur-2xl" />
      <div className="absolute top-6 right-1/4 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
      <div className="absolute top-10 right-1/3 w-2 h-2 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '0.8s' }} />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {tile && icon && (
            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm items-center justify-center border border-white/20 shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {kicker && (
              <div className="flex items-center gap-2 mb-1">
                {!tile && icon && <span className="text-brand-200 shrink-0">{icon}</span>}
                <span className="text-brand-200 text-sm font-medium tracking-wide uppercase">{kicker}</span>
              </div>
            )}
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight break-words ${titleClassName}`}>
              {title}
            </h1>
            {subtitle && <p className="text-brand-200 mt-1 text-sm max-w-md">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
      </div>
    </div>
  )
}