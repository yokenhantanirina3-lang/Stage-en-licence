import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  onChange: (page: number) => void
}

function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('…')
  pages.push(total)
  return pages
}

export default function Pagination({ page, totalPages, total, onChange }: PaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-surface-100 bg-surface-50/40">
      <span className="text-xs font-medium text-surface-400">
        {total.toLocaleString('fr-FR')} résultat{total > 1 ? 's' : ''} · page {page} sur {totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Page précédente"
          className="p-2 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 hover:border-surface-300 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          <ChevronLeft size={15} className="text-surface-600" />
        </button>
        <div className="flex items-center gap-1 px-2">
          {buildPages(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`e-${i}`} className="px-1 text-sm text-surface-400">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 ${
                  p === page
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                    : 'text-surface-400 hover:text-surface-700 hover:bg-surface-100'
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Page suivante"
          className="p-2 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 hover:border-surface-300 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          <ChevronRight size={15} className="text-surface-600" />
        </button>
      </div>
    </div>
  )
}