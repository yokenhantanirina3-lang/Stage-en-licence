import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '@/features/auth/api'
import {
  PenLine, ArrowRight, Inbox, Tags, Building2, FileText, Landmark, BadgeCheck,
} from 'lucide-react'

interface DossierAQualifier {
  id: number
  numero_dossier: string
  statut: string
  canal_entree: string | null
  date_depot: string | null
  montant_concerne: number | null
  reference_imposition: string | null
  resume_faits: string | null
  contribuable: { nom_raison_sociale: string | null; numero_fiscal: string | null }
}

interface TypeReclamation { id: number; code: string }
interface MotifReclamation { id: number; code: string; id_type: number }

const STATUT_FR: Record<string, string> = {
  ENREGISTREE: 'Enregistree',
  A_QUALIFIER: 'A qualifier',
}

const STATUT_BADGE: Record<string, string> = {
  ENREGISTREE: 'bg-brand-50 text-brand-700 border border-brand-200/60',
  A_QUALIFIER: 'bg-amber-50 text-amber-700 border border-amber-200/60',
}

const TYPE_FR: Record<string, string> = {
  CONTENTIEUSE: 'Contentieuse',
  GRACIEUSE: 'Gracieuse',
  PRESCRIPTION: 'Prescription',
}

const MOTIF_FR: Record<number, string> = {
  1: 'Erreur de calcul',
  2: 'Contestation redressement',
  3: 'Erreur base imposable',
  4: 'Difficultes de paiement',
  5: 'Demande de remise',
  6: 'Erreur materielle',
  7: 'Prescription acquise',
  8: 'Restitution paiement indu',
}

export default function Qualification() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selection, setSelection] = useState<Record<number, { type: string; motif: string }>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['reclamations-a-qualifier'],
    queryFn: () => api.get('/api/v1/reclamations/a-qualifier').then((r) => r.data),
    refetchInterval: 30000,
  })

  const types = useQuery({
    queryKey: ['types-reclamations'],
    queryFn: () => api.get('/api/v1/reclamations/types').then((r) => r.data),
  })

  const motifs = useQuery({
    queryKey: ['motifs-reclamation'],
    queryFn: () => api.get('/api/v1/reclamations/motifs').then((r) => r.data),
  })

  const typesList: TypeReclamation[] = Array.isArray(types.data) ? types.data : []
  const motifsList: MotifReclamation[] = Array.isArray(motifs.data) ? motifs.data : []

  const qualifyMutation = useMutation({
    mutationFn: ({ id, idType, idMotif }: { id: number; idType: number; idMotif: number }) =>
      api.patch(`/api/v1/reclamations/${id}/qualifier`, { id_type: idType, id_motif: idMotif }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reclamations-a-qualifier'] })
      queryClient.invalidateQueries({ queryKey: ['reclamations-a-instruire'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-a-qualifier'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-a-instruire'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-stats'] })
      queryClient.invalidateQueries({ queryKey: ['reclamations'] })
    },
  })

  const items: DossierAQualifier[] = data?.items || []

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-surface-400 animate-pulse">Chargement des dossiers a qualifier...</p>
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
            <PenLine size={19} className="text-white" />
          </div>
          <span className="text-brand-200 text-sm font-medium tracking-wide uppercase">Espace de qualification</span>
        </div>
        <h1 className="relative z-10 text-3xl font-extrabold tracking-tight mt-1">Dossiers a qualifier</h1>
        <p className="relative z-10 text-brand-200 mt-2 text-sm max-w-lg">
          Categorisez les dossiers recus (type et motif de reclamation) puis transmettez-les a l'instruction.
        </p>
      </div>

      {/* Liste */}
      {items.length === 0 ? (
        <div className="card p-10 text-center" style={{ animation: 'slideUp 0.5s ease-out 0.2s backwards' }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-50 flex items-center justify-center mx-auto mb-4">
            <Inbox size={26} className="text-surface-400" />
          </div>
          <p className="font-semibold text-surface-700">Aucun dossier a qualifier</p>
          <p className="text-sm text-surface-400 mt-1">Vous etes a jour, rien a qualifier pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
          {items.map((d, i) => {
            const sel = selection[d.id] || { type: '', motif: '' }
            const motifsFiltres = motifsList.filter((m) => m.id_type === Number(sel.type))
            const pret = Boolean(sel.type && sel.motif)
            return (
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
                <div className="space-y-1.5 mb-3 text-xs text-surface-500">
                  <p className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-surface-400" />
                    NIF {d.contribuable?.numero_fiscal || 'n/d'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Landmark size={13} className="text-surface-400" />
                    Canal : {d.canal_entree || 'n/d'} Â· Depose le {d.date_depot ? new Date(d.date_depot).toLocaleDateString('fr-FR') : 'n/d'}
                  </p>
                  {d.montant_concerne != null && Number(d.montant_concerne) > 0 && (
                    <p className="flex items-center gap-1.5 font-medium text-surface-700">
                      <span className="text-surface-400">DF</span>{Number(d.montant_concerne).toLocaleString('fr-FR')} Ar
                    </p>
                  )}
                  {d.resume_faits && (
                    <p className="flex items-start gap-1.5 line-clamp-2">
                      <FileText size={13} className="text-surface-400 shrink-0 mt-0.5" />{d.resume_faits}
                    </p>
                  )}
                </div>

                {/* Formulaire qualification */}
                <div className="space-y-2 rounded-xl border border-surface-200 bg-surface-50/50 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-surface-500 tracking-wide uppercase">
                    <Tags size={12} /> Qualification
                  </p>
                  <select
                    value={sel.type}
                    onChange={(e) => setSelection({ ...selection, [d.id]: { type: e.target.value, motif: '' } })}
                    className="select text-xs"
                  >
                    <option value="">Type de reclamation...</option>
                    {typesList.map((t) => (
                      <option key={t.id} value={t.id}>{TYPE_FR[t.code] || t.code}</option>
                    ))}
                  </select>
                  <select
                    value={sel.motif}
                    onChange={(e) => setSelection({ ...selection, [d.id]: { ...sel, motif: e.target.value } })}
                    className="select text-xs"
                    disabled={!sel.type}
                  >
                    <option value="">Motif...</option>
                    {motifsFiltres.map((m) => (
                      <option key={m.id} value={m.id}>{MOTIF_FR[m.id] || m.code}</option>
                    ))}
                  </select>
                </div>

                {/* Action */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/app/reclamations/${d.id}`)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-600 text-xs font-semibold transition-all"
                  >
                    <FileText size={14} /> Fiche
                  </button>
                  <button
                    onClick={() => {
                      const t = Number(sel.type); const m = Number(sel.motif)
                      if (t && m) qualifyMutation.mutate({ id: d.id, idType: t, idMotif: m })
                    }}
                    disabled={!pret || qualifyMutation.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 text-white text-xs font-semibold shadow-sm shadow-brand-500/20 hover:-translate-y-0.5 hover:shadow-brand-500/30 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                  >
                    <BadgeCheck size={14} /> Qualifier et transmettre
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Erreur mutation */}
      {qualifyMutation.isError && (
        <p className="text-xs text-amber-600 bg-amber-50 px-4 py-3 rounded-xl border border-amber-100">
          {(() => {
            const d = (qualifyMutation.error as any)?.response?.data?.detail
            if (Array.isArray(d)) return d.map((e: any) => e.msg).join(' | ')
            return d || 'Erreur lors de la qualification'
          })()}
        </p>
      )}
    </div>
  )
}
