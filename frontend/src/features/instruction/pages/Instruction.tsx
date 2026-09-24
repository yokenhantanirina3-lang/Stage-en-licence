import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/features/auth/api'
import {
  ClipboardEdit, FileText, Paperclip, Clock, ArrowRight, Inbox,
  PenTool, CheckCircle2,
} from 'lucide-react'

interface DossierAInstruire {
  id: number
  numero_dossier: string
  statut: string
  date_depot: string | null
  date_limite_reponse: string | null
  montant_concerne: number | null
  reference_imposition: string | null
  resume_faits: string | null
  nb_pieces: number
  contribuable: { nom_raison_sociale: string | null; numero_fiscal: string | null }
  type: { libelle: string | null; code: string | null }
  motif: { libelle: string | null }
  decision: { existe: boolean; statut: string; type_decision: string } | null
}

const STATUT_FR: Record<string, string> = {
  EN_INSTRUCTION: 'En instruction',
  EN_ATTENTE_PIECES: 'En attente de pieces',
  PROJET_REPONSE: 'Projet de reponse',
}

const STATUT_BADGE: Record<string, string> = {
  EN_INSTRUCTION: 'bg-brand-50 text-brand-700 border border-brand-200/60',
  EN_ATTENTE_PIECES: 'bg-amber-50 text-amber-700 border border-amber-200/60',
  PROJET_REPONSE: 'bg-brand-50 text-brand-700 border border-brand-200/60',
}

const DECISION_STATUT_FR: Record<string, string> = {
  BROUILLON: 'Brouillon',
  VALIDEE: 'Validee',
  SIGNEE: 'Signee',
  NOTIFIEE: 'Notifiee',
}

export default function Instruction() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['reclamations-a-instruire'],
    queryFn: () => api.get('/api/v1/reclamations/a-instruire').then((r) => r.data),
    refetchInterval: 30000,
  })

  const items: DossierAInstruire[] = data?.items || []

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-surface-400 animate-pulse">Chargement des dossiers a instruire...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-900 via-surface-900 to-brand-900 p-8 text-white" style={{ animation: 'slideUp 0.5s ease-out' }}>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <ClipboardEdit size={19} className="text-white" />
          </div>
          <span className="text-brand-200 text-sm font-medium tracking-wide uppercase">Espace d'instruction</span>
        </div>
        <h1 className="relative z-10 text-3xl font-extrabold tracking-tight mt-1">Dossiers a instruire</h1>
        <p className="relative z-10 text-brand-200 mt-2 text-sm max-w-lg">
          {items.length > 0
            ? `${items.length} dossier${items.length > 1 ? 's' : ''} a instruire : analyser les pieces, citer le droit applicable et rediger la decision.`
            : 'Instruisez ces dossiers : analysez les pieces, cisez le droit applicable et redigez la decision.'}
        </p>
        {items.length > 0 && (
          <div className="relative z-10 inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
            <PenTool size={14} className="text-brand-200" />
            <span className="text-sm font-bold text-white">{items.length} dossier{items.length > 1 ? 's' : ''} en attente</span>
          </div>
        )}
      </div>

      {/* Liste */}
      {items.length === 0 ? (
        <div className="card p-10 text-center" style={{ animation: 'slideUp 0.5s ease-out 0.2s backwards' }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-50 flex items-center justify-center mx-auto mb-4">
            <Inbox size={26} className="text-surface-400" />
          </div>
          <p className="font-semibold text-surface-700">Aucun dossier a instruire</p>
          <p className="text-sm text-surface-400 mt-1">Vous etes a jour, rien a instruire pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((d, i) => (
            <div
              key={d.id}
              className="card p-5 group hover:shadow-elevated transition-all duration-300 border-l-4 border-l-brand-500"
              style={{ animation: 'slideUp 0.5s ease-out backwards', animationDelay: `${i * 0.06}s` }}
            >
              {/* Top */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold text-brand-600">{d.numero_dossier}</p>
                  <p className="text-sm font-semibold text-surface-900 mt-0.5 truncate">
                    {d.contribuable?.nom_raison_sociale || 'Contribuable'}
                  </p>
                </div>
                <span className={`badge text-[10px] shrink-0 ${STATUT_BADGE[d.statut] || 'bg-surface-100 text-surface-600 border border-surface-200/60'}`}>
                  {STATUT_FR[d.statut] || d.statut}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 mb-1 text-xs text-surface-500">
                <p className="flex items-center gap-1.5">
                  <FileText size={13} className="text-surface-400" />
                  {d.type?.libelle || 'Type non defini'}{d.motif?.libelle ? ` - ${d.motif.libelle}` : ''}
                </p>
                {d.montant_concerne != null && Number(d.montant_concerne) > 0 && (
                  <p className="flex items-center gap-1.5 font-medium text-surface-700">
                    <span className="text-surface-400">DF</span>
                    {Number(d.montant_concerne).toLocaleString('fr-FR')} Ar
                  </p>
                )}
                <p className="flex items-center gap-1.5">
                  <Paperclip size={13} className="text-surface-400" /> {d.nb_pieces} piece{d.nb_pieces > 1 ? 's' : ''} jointe{d.nb_pieces > 1 ? 's' : ''}
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock size={13} className="text-surface-400" />
                  Limite : {d.date_limite_reponse ? new Date(d.date_limite_reponse).toLocaleDateString('fr-FR') : 'indefinie'}
                </p>
              </div>

              {/* Etat decision */}
              {d.decision?.existe ? (
                <div className="flex items-center gap-1.5 mt-3 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={13} />
                  Decision redigee ({DECISION_STATUT_FR[d.decision.statut] || d.decision.statut})
                </div>
              ) : (
                <p className="text-xs text-surface-400 mt-3">Aucune decision redigee pour ce dossier.</p>
              )}

              {/* Action */}
              <div className="mt-4">
                <button
                  onClick={() => navigate(`/app/reclamations/${d.id}`)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 text-white text-xs font-semibold shadow-sm shadow-brand-500/20 hover:-translate-y-0.5 hover:shadow-brand-500/30 transition-all"
                >
                  <PenTool size={14} />
                  {d.decision?.existe ? 'Reprendre la decision' : 'Rediger la decision'}
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
