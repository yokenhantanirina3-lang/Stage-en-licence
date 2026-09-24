import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export default function EmptyState({
  title = 'Aucune donnée',
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-50 flex items-center justify-center">
        {icon || <Inbox size={26} className="text-surface-400" />}
      </div>
      <div>
        <p className="font-semibold text-surface-700 text-base">{title}</p>
        {description && <p className="text-sm text-surface-400 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}