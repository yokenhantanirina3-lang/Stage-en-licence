import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import {
  ClipboardCheck, FileText, Stamp, PenTool, CheckCircle2, XCircle,
  ArrowRight, ShieldCheck, Inbox, Clock,
} from 'lucide-react'

interface DossierAValider {
  id: number
  numero_dossier: string
  statut: string
  date_depot: string | null
  date_limite_reponse: string | null
  montant_concerne: number | null
  contribuable: { nom_raison_sociale: string | null; numero_fiscal: string | null }
  type: { libelle: string | null; code: string | null }
  decision: {
    id: number | null
    type_decision: string | null
    fondement_juridique: string | null
    montant_accorde: number | null
    montant_rejete: number | null
  }
}

const STATUT_FR: Record<string, string> = {
  EN_VALIDATION: 'En attente de validation',
  EN_VISA_DIRECTEUR: 'En attente de visa',
  SIGNEE: 'Signee - a notifier',
}

const STATUT_BADGE: Record<string, string> = {
  EN_VALIDATION: 'bg-brand-50 text-brand-700 border border-brand-200/60',
  EN_VISA_DIRECTEUR: 'bg-brand-50 text-brand-700 border border-brand-200/60',
}

const TYPE_DECISION_FR: Record<string, string> = {
  ADMIS_TOTAL: 'Admission totale',
  ADMIS_PARTIEL: 'Admission partielle',
  REJETE: 'Rejet',
  IRRECEVABLE: 'Irrecevable',
  CADUC: 'Caduc',
}

export default function Validations() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const role = user?.role?.libelle || ''
  const isChef = role === 'CHEF' || role === 'ADMIN'
  const isDirecteur = role === 'DIRECTEUR' || role === 'ADMIN'

  const [onglet, setOnglet] = useState<'chef' | 'directeur'>(role === 'DIRECTEUR' ? 'directeur' : 'chef')

  const setOngletSafe = (o: 'chef' | 'directeur') => {
    if (o === 'chef' && !isChef) return
    if (o === 'directeur' && !isDirecteur) return
    setOnglet(o)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['reclamations-a-valider'],
    queryFn: () => api.get('/api/v1/reclamations/a-valider').then((r) => r.data),
    refetchInterval: 30000,
  })

  const action = (path: string, decisionId: number | null, body?: any) =>
    api.post(`/api/v1/decisions/${decisionId}/${path}`, body || {})

  const actionMutation = useMutation({
    mutationFn: ({ path, decisionId, body }: { path: string; decisionId: number | null; body?: any }) =>
      action(path, decisionId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reclamations-a-valider'] })
      queryClient.invalidateQueries({ queryKey: ['stats-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['reclamations'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-a-valider'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-stats'] })
      queryClient.invalidateQueries({ queryKey: ['reclamations-a-instruire'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-a-instruire'] })
      if (variables.path === 'notifier') setToast('DÃ©cision notifiÃ©e au contribuable')
      else if (variables.path === 'valider') setToast(variables.body?.avis === 'FAVORABLE' ? 'Avis favorable enregistrÃ©' : 'Avis dÃ©favorable enregistrÃ©')
    },
  })

  // Enchaine tout le circuit du directeur sur un dossier EN_VISA_DIRECTEUR :
  // visa -> signer -> notifier (avec generation du PDF de decision).
  const circuitDirecteur = useMutation({
    mutationFn: async (decisionId: number | null) => {
      await action('visa', decisionId, {})
      await action('signer', decisionId, {})
      await action('notifier', decisionId, {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reclamations-a-valider'] })
      queryClient.invalidateQueries({ queryKey: ['stats-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['reclamations'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-a-valider'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-stats'] })
      queryClient.invalidateQueries({ queryKey: ['reclamations-a-instruire'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-a-instruire'] })
      setToast('Visa, signature et notification terminÃ©s')
    },
  })

  const circuitError = (circuitDirecteur.error as any)?.response?.data?.detail
    || (circuitDirecteur.error as any)?.message
    || null

  const items: DossierAValider[] = data?.items || []
  const compteurs = data?.compteurs || {}

  // selon l'onglet actif on filtre les dossier concernes
  const dossiers = items.filter((d) =>
    onglet === 'chef' ? d.statut === 'EN_VALIDATION' : ['EN_VISA_DIRECTEUR', 'SIGNEE'].includes(d.statut),
  )

  const accueilLabel = role === 'DIRECTEUR' ? 'Directeur' : role === 'CHEF' ? 'Chef de service' : 'Administrateur'

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-surface-400 animate-pulse">Chargement des dossiers a valider...</p>
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
            <ClipboardCheck size={19} className="text-white" />
          </div>
          <span className="text-brand-200 text-sm font-medium tracking-wide uppercase">Espace de validation</span>
        </div>
        <h1 className="relative z-10 text-3xl font-extrabold tracking-tight mt-1">Dossiers a valider</h1>
        <p className="relative z-10 text-brand-200 mt-2 text-sm max-w-lg">
          Bienvenue {accueilLabel}. Traitez ici les decisions qui attendent votre action.
        </p>
      </div>

      {/* Onglets */}
      {(isChef && isDirecteur) && (
        <div className="flex gap-2 bg-surface-100 p-1 rounded-xl w-fit" style={{ animation: 'slideUp 0.4s ease-out 0.1s backwards' }}>
          <button
            onClick={() => setOngletSafe('chef')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              onglet === 'chef' ? 'bg-white shadow text-surface-900' : 'text-surface-500 hover:text-surface-800'
            }`}
          >
            <ShieldCheck size={15} />
            Avis du chef
            <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold bg-brand-500/15 text-brand-700">
              {compteurs.en_validation || 0}
            </span>
          </button>
          <button
            onClick={() => setOngletSafe('directeur')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              onglet === 'directeur' ? 'bg-white shadow text-surface-900' : 'text-surface-500 hover:text-surface-800'
            }`}
          >
            <PenTool size={15} />
            Visa directeur
            <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold bg-brand-500/15 text-brand-700">
              {compteurs.en_visa_directeur || 0}
            </span>
          </button>
        </div>
      )}

      {/* Bandeau d'erreur de validation */}
      {circuitError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700" style={{ animation: 'slideUp 0.3s ease-out' }}>
          <span className="flex items-center gap-2">
            <XCircle size={16} />
            {circuitError}
          </span>
          <button onClick={() => circuitDirecteur.reset()} className="text-xs font-bold text-amber-700 hover:text-amber-800 underline">
            Fermer
          </button>
        </div>
      )}

      {/* Liste des dossiers */}
      {dossiers.length === 0 ? (
        <div className="card p-10 text-center" style={{ animation: 'slideUp 0.5s ease-out 0.2s backwards' }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-50 flex items-center justify-center mx-auto mb-4">
            <Inbox size={26} className="text-surface-400" />
          </div>
          <p className="font-semibold text-surface-700">Aucun dossier en attente</p>
          <p className="text-sm text-surface-400 mt-1">Vous etes a jour, rien a valider pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {dossiers.map((d, i) => (
            <div
              key={d.id}
              className="card p-5 group hover:shadow-elevated transition-all duration-300 border-l-4 border-l-brand-500"
              style={{ animation: 'slideUp 0.5s ease-out backwards', animationDelay: `${i * 0.06}s` }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-xs font-bold text-brand-600">{d.numero_dossier}</p>
                  <p className="text-sm font-semibold text-surface-900 mt-0.5 truncate">
                    {d.contribuable?.nom_raison_sociale || 'Contribuable'}
                  </p>
                </div>
                <span className={`badge text-[10px] ${STATUT_BADGE[d.statut] || 'bg-surface-100 text-surface-600 border border-surface-200/60'}`}>
                  {STATUT_FR[d.statut] || d.statut}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 mb-4 text-xs text-surface-500">
                {d.type?.libelle && (
                  <p className="flex items-center gap-1.5">
                    <FileText size={13} className="text-surface-400" /> {d.type.libelle}
                  </p>
                )}
                {d.decision?.type_decision && (
                  <p className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-surface-400" /> {TYPE_DECISION_FR[d.decision.type_decision] || d.decision.type_decision}
                  </p>
                )}
                {d.decision?.montant_accorde != null && Number(d.decision.montant_accorde) > 0 && (
                  <p className="flex items-center gap-1.5 text-emerald-600 font-medium">
                    <CheckCircle2 size={13} /> {Number(d.decision.montant_accorde).toLocaleString('fr-FR')} Ar accorde
                  </p>
                )}
                <p className="flex items-center gap-1.5">
                  <Clock size={13} className="text-surface-400" />
                  Limite : {d.date_limite_reponse ? new Date(d.date_limite_reponse).toLocaleDateString('fr-FR') : 'indefinie'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-surface-100 pt-3">
                {/* Chef: avis de validation */}
                {isChef && d.statut === 'EN_VALIDATION' && (
                  <>
                    <button
                      onClick={() => actionMutation.mutate({ path: 'valider', decisionId: d.decision?.id, body: { avis: 'FAVORABLE' } })}
                      disabled={actionMutation.isPending}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-semibold shadow-sm shadow-emerald-500/20 hover:-translate-y-0.5 hover:shadow-emerald-500/30 transition-all"
                    >
                      <CheckCircle2 size={14} /> Favorable
                    </button>
                    <button
                      onClick={() => actionMutation.mutate({ path: 'valider', decisionId: d.decision?.id, body: { avis: 'DEFAVORABLE' } })}
                      disabled={actionMutation.isPending}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-semibold shadow-sm shadow-amber-500/20 hover:-translate-y-0.5 hover:shadow-amber-500/30 transition-all"
                    >
                      <XCircle size={14} /> Defavorable
                    </button>
                  </>
                )}

                {/* Directeur: visa puis signature */}
                {isDirecteur && d.statut === 'EN_VISA_DIRECTEUR' && (
                  <button
                    onClick={() => circuitDirecteur.mutate(d.decision?.id)}
                    disabled={circuitDirecteur.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-brand-500 to-indigo-600 text-white text-xs font-semibold shadow-sm shadow-brand-500/20 hover:-translate-y-0.5 hover:shadow-brand-500/30 transition-all"
                  >
                    <Stamp size={14} /> {circuitDirecteur.isPending ? 'Traitement...' : 'Visa, signer et notifier'}
                  </button>
                )}

                {isDirecteur && d.statut === 'SIGNEE' && (
                  <button
                    onClick={() => actionMutation.mutate({ path: 'notifier', decisionId: d.decision?.id })}
                    disabled={actionMutation.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-semibold shadow-sm shadow-brand-500/20 hover:-translate-y-0.5 hover:shadow-brand-500/30 transition-all"
                  >
                    <ShieldCheck size={14} /> Notifier la decision
                  </button>
                )}

                <button
                  onClick={() => navigate(`/app/reclamations/${d.id}`)}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-600 text-xs font-semibold transition-all"
                  title="Ouvrir le dossier"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast de succÃ¨s animÃ© */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50" style={{ animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-white shadow-2xl shadow-emerald-500/20 border border-emerald-200/60 backdrop-blur-xl">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 size={20} className="text-white" />
              <span className="absolute inset-0 rounded-xl bg-emerald-400 opacity-0" style={{ animation: 'pulseSoft 1.6s ease-out forwards' }} />
            </div>
            <div>
              <p className="text-sm font-bold text-surface-900">{toast}</p>
              <p className="text-xs text-surface-400 mt-0.5">OpÃ©ration effectuÃ©e avec succÃ¨s</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
