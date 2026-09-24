export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-surface-200/70 rounded-md animate-pulse ${className}`}
    />
  )
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="card p-5"
          style={{ animation: 'fadeIn 0.4s ease-out backwards', animationDelay: `${i * 0.08}s` }}
        >
          <div className="flex items-center justify-between mb-4">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-10 w-10 rounded-xl" />
          </div>
          <SkeletonBlock className="h-8 w-20 mb-2" />
          <SkeletonBlock className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200/80">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="py-4 px-6 text-left">
                  <SkeletonBlock className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} style={{ animation: 'fadeIn 0.4s ease-out backwards', animationDelay: `${r * 0.06}s` }}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="py-4 px-6">
                    <SkeletonBlock className={`h-3.5 ${c % 3 === 0 ? 'w-24' : 'w-full max-w-[90px]'}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function SkeletonHero() {
  return (
    <div className="space-y-5">
      <div className="card p-6" style={{ animation: 'fadeIn 0.4s ease-out backwards' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-7 w-56" />
            <SkeletonBlock className="h-3.5 w-72" />
            <SkeletonBlock className="h-3.5 w-48" />
          </div>
          <SkeletonBlock className="h-10 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {[0, 1].map((i) => (
            <div key={i} className="card p-6" style={{ animation: 'fadeIn 0.4s ease-out backwards', animationDelay: '0.1s' }}>
              <SkeletonBlock className="h-5 w-40 mb-4" />
              <div className="space-y-3">
                <SkeletonBlock className="h-3.5 w-full" />
                <SkeletonBlock className="h-3.5 w-5/6" />
                <SkeletonBlock className="h-3.5 w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="card p-6 space-y-3" style={{ animation: 'fadeIn 0.4s ease-out backwards', animationDelay: '0.15s' }}>
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-10 w-full rounded-lg mt-4" />
        </div>
      </div>
    </div>
  )
}