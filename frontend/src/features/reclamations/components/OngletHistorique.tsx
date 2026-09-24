import { useQuery } from '@tanstack/react-query'
import api from '@/features/auth/api'
import { Clock, Circle, Inbox, History } from 'lucide-react'

const actionStyles: Record<string, { bg: string; text: string; dot: string }> = {
  CREATION: { bg: 'bg-surface-100', text: 'text-surface-600', dot: 'bg-surface-400' },
  QUALIFICATION: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  DEMANDE_PIECES: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-600' },
  RECEPTION_PIECES: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  REDACTION: { bg: 'bg-brand-50', text: 'text-brand-700', dot: 'bg-brand-500' },
  AVIS_CHEF: { bg: 'bg-brand-100', text: 'text-brand-800', dot: 'bg-brand-600' },
  VISA_DIR: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  SIGNATURE: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-600' },
  ENVOI: { bg: 'bg-brand-50', text: 'text-brand-700', dot: 'bg-brand-500' },
  CLOTURE: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  ALERTE_DELAI: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-600' },
}

const defaultStyle = { bg: 'bg-surface-100', text: 'text-surface-600', dot: 'bg-surface-400' }

const ACTION_FR: Record<string, string> = {
  CREATION: 'Creation', QUALIFICATION: 'Qualification', DEMANDE_PIECES: 'Demande de pieces',
  RECEPTION_PIECES: 'Reception de pieces', REDACTION: 'Redaction', AVIS_CHEF: 'Avis du chef',
  VISA_DIR: 'Visa directeur', SIGNATURE: 'Signature', ENVOI: 'Envoi', CLOTURE: 'Cloture', ALERTE_DELAI: 'Alerte delai',
}

export default function OngletHistorique({ reclamationId }: { reclamationId: string }) {
  const { data: actions, isLoading } = useQuery({
    queryKey: ['historique', reclamationId],
    queryFn: () => api.get(`/api/v1/reclamations/${reclamationId}/historique`).then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!actions || actions.length === 0) {
    return (
      <div className="card p-6 text-center py-16" style={{ animation: 'slideUp 0.4s ease-out' }}>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-50 flex items-center justify-center mx-auto mb-4">
          <Inbox size={24} className="text-surface-400" />
        </div>
        <p className="font-semibold text-surface-700">Aucune action enregistree</p>
        <p className="text-sm text-surface-400 mt-1">L'historique apparaitra ici</p>
      </div>
    )
  }

  return (
    <div className="card p-6" style={{ animation: 'slideUp 0.4s ease-out' }}>
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center"><History size={16} className="text-surface-500" /></div>
        <h2 className="section-title">Historique du dossier</h2>
      </div>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-gradient-to-b from-brand-200 via-surface-200 to-transparent" />

        <div className="space-y-5">
          {actions.map((a: any, i: number) => {
            const style = actionStyles[a.action] || defaultStyle
            return (
              <div
                key={a.id}
                className="relative flex gap-4 group/item"
                style={{ animation: 'slideUp 0.4s ease-out backwards', animationDelay: `${i * 0.06}s` }}
              >
                {/* Dot */}
                <div className={`relative z-10 w-6 h-6 rounded-full ${style.dot} flex items-center justify-center shadow-sm ring-4 ring-white group-hover/item:ring-brand-50 transition-all duration-300`}>
                  <Circle size={8} className="text-white fill-current" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge text-[11px] ${style.bg} ${style.text}`}>{ACTION_FR[a.action] || a.action}</span>
                    <span className="text-xs text-surface-400 flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(a.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  {a.commentaire && (
                    <p className="text-sm text-surface-700 mt-2 leading-relaxed bg-surface-50/50 p-3 rounded-xl border border-surface-100 group-hover/item:border-surface-200 transition-colors">
                      {a.commentaire}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
