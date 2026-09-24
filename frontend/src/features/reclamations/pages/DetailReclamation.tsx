import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import {
  ArrowLeft,
  FileText,
  Calendar,
  DollarSign,
  Tag,
  Clock,
  Layers,
  Info,
  AlertCircle,
  Download,
  UserRound,
  UserCircle2,
  Loader2,
  X,
} from 'lucide-react'
import OngletPieces from '../components/OngletPieces'
import OngletDecision from '../components/OngletDecision'
import OngletHistorique from '../components/OngletHistorique'
import { SkeletonHero } from '@/components/Skeleton'
import { showToast } from '@/components/Toast'
import PageHero from '@/components/PageHero'

const STATUT_FR: Record<string, string> = {
  ENREGISTREE: 'Enregistree',
  A_QUALIFIER: 'A qualifier',
  EN_INSTRUCTION: 'En instruction',
  EN_ATTENTE_PIECES: 'En attente pieces',
  PROJET_REPONSE: 'Projet reponse',
  EN_VALIDATION: 'En validation',
  EN_VISA_DIRECTEUR: 'Visa directeur',
  SIGNEE: 'Signee',
  NOTIFIEE: 'Notifiee',
  CLOTUREE: 'Cloturee',
  REJETEE: 'Rejetee',
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: React.ReactNode
  icon?: any
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-surface-100/80 last:border-0 group/row hover:bg-surface-50/50 -mx-3 px-3 rounded-lg transition-colors">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center group-hover/row:bg-brand-50 transition-colors">
            <Icon
              size={13}
              className="text-surface-400 group-hover/row:text-brand-500 transition-colors"
            />
          </div>
        )}
        <span className="text-sm text-surface-500">{label}</span>
      </div>

      <span className="text-sm font-medium text-surface-900 text-right">
        {value}
      </span>
    </div>
  )
}

const ONGLETS = [
  { id: 'infos', label: 'Informations', icon: Info },
  { id: 'pieces', label: 'Pieces', icon: Tag },
  { id: 'decision', label: 'Decision', icon: DollarSign },
  { id: 'historique', label: 'Historique', icon: Clock },
] as const

export default function DetailReclamation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const [ongletActif, setOngletActif] =
    useState<(typeof ONGLETS)[number]['id']>('infos')

  const [idType, setIdType] = useState('')
  const [idMotif, setIdMotif] = useState('')
  const [idInstructeur, setIdInstructeur] = useState('')

  const { data: rec, isLoading } = useQuery({
    queryKey: ['reclamation', id],
    queryFn: () =>
      api.get(`/api/v1/reclamations/${id}`).then((r) => r.data),
  })

  /*
   * Le rôle est déclaré UNE SEULE FOIS ici.
   * Il est ensuite utilisé pour :
   * - l'affectation
   * - la qualification
   * - OngletDecision
   */
  const role = user?.role?.libelle

  const peutAffecter = [
    'ADMIN',
    'CHEF',
    'DIRECTEUR',
    'INSTRUCTEUR',
  ].includes(role || '')

  const { data: affectations } = useQuery({
    queryKey: ['affectations', id],
    queryFn: () =>
      api
        .get(`/api/v1/reclamations/${id}/affectations`)
        .then((r) => r.data),
    enabled: peutAffecter,
  })

  const { data: instructeurs } = useQuery({
    queryKey: ['instructeurs'],
    queryFn: () =>
      api
        .get('/api/v1/reclamations/instructeurs')
        .then((r) => r.data),
    enabled: peutAffecter,
  })

  const affecterMutation = useMutation({
    mutationFn: (idAgent: number) =>
      api.post(`/api/v1/reclamations/${id}/affectation`, {
        id_agent: idAgent,
        role: 'INSTRUCTEUR',
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['affectations', id],
      })

      queryClient.invalidateQueries({
        queryKey: ['historique', id],
      })

      queryClient.invalidateQueries({
        queryKey: ['reclamation', id],
      })

      setIdInstructeur('')
    },
  })

  const desaffecterMutation = useMutation({
    mutationFn: (affectationId: number) =>
      api.delete(
        `/api/v1/reclamations/${id}/affectation/${affectationId}`,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['affectations', id],
      })

      queryClient.invalidateQueries({
        queryKey: ['historique', id],
      })

      queryClient.invalidateQueries({
        queryKey: ['reclamation', id],
      })
    },
  })

  const { data: types } = useQuery({
    queryKey: ['types-reclamation'],
    queryFn: () =>
      api
        .get('/api/v1/reclamations/types')
        .then((r) => r.data),
  })

  const { data: motifs } = useQuery({
    queryKey: ['motifs-reclamation', idType],
    queryFn: () =>
      api
        .get('/api/v1/reclamations/motifs', {
          params: {
            id_type: Number(idType),
          },
        })
        .then((r) => r.data),

    enabled: !!idType,
  })

  const qualifierMutation = useMutation({
    mutationFn: (data: {
      id_type: number
      id_motif: number
    }) =>
      api.patch(
        `/api/v1/reclamations/${id}/qualifier`,
        data,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['reclamation', id],
      })

      queryClient.invalidateQueries({
        queryKey: ['reclamations'],
      })

      queryClient.invalidateQueries({
        queryKey: ['historique', id],
      })

      setIdType('')
      setIdMotif('')
    },
  })

  if (isLoading) {
    return <SkeletonHero />
  }

  if (!rec) {
    return (
      <div
        className="text-center py-20"
        style={{ animation: 'slideUp 0.5s ease-out' }}
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle
            size={28}
            className="text-surface-400"
          />
        </div>

        <p className="text-lg font-semibold text-surface-700 mb-2">
          Reclamation introuvable
        </p>

        <button
          onClick={() => navigate('/app/reclamations')}
          className="btn-primary mt-4"
        >
          Retour a la liste
        </button>
      </div>
    )
  }

  /*
   * IMPORTANT :
   * On NE redéclare PAS "role" ici.
   * La variable role déclarée plus haut est utilisée.
   */
  const peutQualifierRole =
    ['ADMIN', 'SAISIE', 'INSTRUCTEUR'].includes(role || '')
  const qualificationAutorisee =
    ['ENREGISTREE', 'A_QUALIFIER'].includes(rec.statut)

  const handleQualifier = (e: React.FormEvent) => {
    e.preventDefault()

    if (!idType || !idMotif) {
      return
    }

    qualifierMutation.mutate({
      id_type: parseInt(idType),
      id_motif: parseInt(idMotif),
    })
  }

  const handleDownloadAccuse = async () => {
    try {
      const res = await api.get(
        `/api/v1/reclamations/${id}/accuse`,
        {
          responseType: 'blob',
        },
      )

      const blob = res.data

      const contentType = String(
        res.headers?.['content-type'] || '',
      )

      if (
        contentType.includes('json') ||
        blob?.type?.includes('application/json')
      ) {
        const text = await blob.text()
        const data = JSON.parse(text)

        if (data.url) {
          window.open(data.url, '_blank')
        }

        return
      }

      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `accuse_${rec?.numero_dossier || id}.pdf`

      document.body.appendChild(a)
      a.click()
      a.remove()

      URL.revokeObjectURL(url)
    } catch {
      showToast(
        "Impossible de telecharger l'accuse de reception.",
        'error',
      )
    }
  }

  const handleDownloadDossier = async () => {
    try {
      const res = await api.get(
        `/api/v1/reclamations/${id}/pdf`,
        {
          responseType: 'blob',
        },
      )

      const url = URL.createObjectURL(res.data)

      const a = document.createElement('a')
      a.href = url
      a.download = `dossier_${rec?.numero_dossier || id}.pdf`

      document.body.appendChild(a)
      a.click()
      a.remove()

      URL.revokeObjectURL(url)
    } catch {
      showToast(
        'Impossible de telecharger le dossier PDF.',
        'error',
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/app/reclamations')}
        className="btn-ghost -ml-2"
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      {/* Hero Header */}
      <PageHero
        tile
        icon={<FileText size={26} className="text-white" />}
        kicker="Dossier réclamation"
        title={rec.numero_dossier}
        titleClassName="font-mono"
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={13} />
            Deposee le{' '}
            {new Date(rec.date_depot).toLocaleDateString('fr-FR')}
          </span>
        }
        actions={
          <>
            <button
              onClick={handleDownloadDossier}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold hover:bg-white/25 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Download size={16} />
              Dossier PDF
            </button>

            {rec.pdf_accuse_path && (
              <button
                onClick={handleDownloadAccuse}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-brand-700 text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <Download size={16} />
                Accuse de reception
              </button>
            )}

            <span className="badge text-sm px-4 py-2 font-semibold backdrop-blur-sm bg-white/15 border border-white/20 text-white">
              {STATUT_FR[rec.statut] || rec.statut}
            </span>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div
            className="flex gap-1 p-1.5 bg-surface-100/80 rounded-2xl backdrop-blur-sm"
            style={{
              animation:
                'slideUp 0.5s ease-out 0.1s backwards',
            }}
          >
            {ONGLETS.map((o) => (
              <button
                key={o.id}
                onClick={() => setOngletActif(o.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex-1 justify-center ${
                  ongletActif === o.id
                    ? 'bg-white text-brand-700 shadow-sm shadow-brand-500/5'
                    : 'text-surface-500 hover:text-surface-700 hover:bg-white/40'
                }`}
              >
                <o.icon size={15} />
                {o.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div
            key={ongletActif}
            style={{ animation: 'slideUp 0.4s ease-out' }}
          >
            {/* Informations */}
            {ongletActif === 'infos' && (
              <div className="space-y-6">
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                      <Info
                        size={16}
                        className="text-brand-600"
                      />
                    </div>

                    <h2 className="section-title">
                      Informations
                    </h2>
                  </div>

                  <div className="space-y-0.5">
                    <InfoRow
                      label="Contribuable"
                      value={`#${rec.id_contribuable}`}
                      icon={FileText}
                    />

                    <InfoRow
                      label="Canal d'entree"
                      value={rec.canal_entree}
                      icon={Tag}
                    />

                    <InfoRow
                      label="Reference imposition"
                      value={
                        rec.reference_imposition || '-'
                      }
                    />

                    <InfoRow
                      label="Montant concerne"
                      value={
                        rec.montant_concerne
                          ? `${Number(
                              rec.montant_concerne,
                            ).toLocaleString(
                              'fr-FR',
                            )} Ar`
                          : '-'
                      }
                      icon={DollarSign}
                    />

                    <InfoRow
                      label="Date limite de reponse"
                      value={
                        rec.date_limite_reponse
                          ? new Date(
                              rec.date_limite_reponse,
                            ).toLocaleDateString(
                              'fr-FR',
                            )
                          : 'Non definie'
                      }
                      icon={Calendar}
                    />
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Layers
                        size={16}
                        className="text-amber-600"
                      />
                    </div>

                    <h2 className="section-title">
                      Resume des faits
                    </h2>
                  </div>

                  <p className="text-sm text-surface-700 whitespace-pre-wrap leading-relaxed bg-surface-50/50 p-4 rounded-xl border border-surface-100">
                    {rec.resume_faits ||
                      'Aucun resume fourni.'}
                  </p>
                </div>
              </div>
            )}

            {/* Pieces */}
            {ongletActif === 'pieces' && (
              <OngletPieces reclamationId={id!} />
            )}

            {/* Decision */}
            {ongletActif === 'decision' && (
              <OngletDecision
                reclamationId={id!}
                statutReclamation={rec.statut}
                role={role}
              />
            )}

            {/* Historique */}
            {ongletActif === 'historique' && (
              <OngletHistorique
                reclamationId={id!}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Qualification */}
          {peutQualifierRole && (
            <div
              className="card p-6"
              style={{
                animation:
                  'slideUp 0.5s ease-out 0.15s backwards',
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Tag
                    size={16}
                    className="text-amber-600"
                  />
                </div>

                <h2 className="section-title">
                  Qualifier
                </h2>
              </div>

              <form
                onSubmit={handleQualifier}
                className="space-y-4"
              >
                <div>
                  <label className="label">
                    Type
                  </label>

                  <select
                    value={idType}
                    onChange={(e) => {
                      setIdType(e.target.value)
                      setIdMotif('')
                    }}
                    required
                    disabled={!qualificationAutorisee}
                    className="select disabled:bg-surface-50 disabled:text-surface-400"
                  >
                    <option value="">
                      Choisir un type...
                    </option>

                    {types?.map((t: any) => (
                      <option
                        key={t.id}
                        value={t.id}
                      >
                        {t.libelle} (
                        {t.delai_legal_jours} j)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">
                    Motif
                  </label>

                  <select
                    value={idMotif}
                    onChange={(e) =>
                      setIdMotif(e.target.value)
                    }
                    required
                    disabled={!idType || !qualificationAutorisee}
                    className="select disabled:bg-surface-50 disabled:text-surface-400"
                  >
                    <option value="">
                      {idType
                        ? 'Choisir un motif...'
                        : 'Choisissez un type dabord'}
                    </option>

                    {motifs?.map((m: any) => (
                      <option
                        key={m.id}
                        value={m.id}
                      >
                        {m.libelle}
                      </option>
                    ))}
                  </select>
                </div>

                {qualifierMutation.isError && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    {(qualifierMutation.error as any)
                      ?.response?.data?.detail ||
                      'Erreur lors de la qualification'}
                  </p>
                )}

                {!qualificationAutorisee && (
                  <p className="text-xs text-surface-500 bg-surface-100 p-3 rounded-xl border border-surface-200">
                    Qualification impossible : le dossier est « {STATUT_FR[rec.statut] || rec.statut} ».
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    qualifierMutation.isPending ||
                    !idType ||
                    !idMotif ||
                    !qualificationAutorisee
                  }
                  className="btn-primary w-full"
                >
                  {qualifierMutation.isPending
                    ? 'Qualification...'
                    : 'Qualifier'}
                </button>
              </form>
            </div>
          )}

          {/* Suivi */}
          <div
            className="card p-6"
            style={{
              animation:
                'slideUp 0.5s ease-out 0.2s backwards',
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center">
                <Clock
                  size={16}
                  className="text-surface-500"
                />
              </div>

              <h2 className="section-title">
                Suivi
              </h2>
            </div>

            <div className="space-y-0.5">
              <InfoRow
                label="Type"
                value={
                  rec.id_type
                    ? `#${rec.id_type}`
                    : 'Non qualifie'
                }
              />

              <InfoRow
                label="Motif"
                value={
                  rec.id_motif
                    ? `#${rec.id_motif}`
                    : '-'
                }
              />

              <InfoRow
                label="Cree le"
                value={new Date(
                  rec.created_at,
                ).toLocaleString('fr-FR')}
                icon={Clock}
              />

              <InfoRow
                label="Modifie le"
                value={new Date(
                  rec.updated_at,
                ).toLocaleString('fr-FR')}
              />
            </div>
          </div>

          {/* Instructeur / Affectation */}
          {peutAffecter && (
            <div
              className="card p-6"
              style={{
                animation:
                  'slideUp 0.5s ease-out 0.25s backwards',
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <UserRound
                    size={16}
                    className="text-brand-600"
                  />
                </div>

                <h2 className="section-title">
                  Instructeur
                </h2>
              </div>

              <div className="space-y-2.5 mb-4">
                {(affectations || []).length === 0 && (
                  <p className="text-xs text-surface-400 bg-surface-50 p-3 rounded-xl border border-dashed border-surface-200 flex items-center gap-2">
                    <UserCircle2 size={14} />
                    Aucun instructeur affecte a ce
                    dossier.
                  </p>
                )}

                {(affectations || []).map((a: any) => (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between gap-2 p-3 rounded-xl border text-sm ${
                      a.actif
                        ? 'bg-brand-50/50 border-brand-100'
                        : 'bg-surface-50 border-surface-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {(a.nom_agent || '?').charAt(
                          0,
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-surface-800 truncate">
                          {a.nom_agent}
                        </p>

                        <p className="text-[10px] text-surface-400 uppercase tracking-wide">
                          {a.role_dossier}{' '}
                          {a.actif
                            ? ''
                            : `· cloture le ${
                                a.date_fin
                                  ? new Date(
                                      a.date_fin,
                                    ).toLocaleDateString(
                                      'fr-FR',
                                    )
                                  : ''
                              }`}
                        </p>
                      </div>
                    </div>

                    {a.actif && (
                      <button
                        onClick={() =>
                          desaffecterMutation.mutate(
                            a.id,
                          )
                        }
                        disabled={
                          desaffecterMutation.isPending
                        }
                        title="Retirer"
                        className="p-1.5 rounded-lg text-surface-400 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={idInstructeur}
                  onChange={(e) =>
                    setIdInstructeur(e.target.value)
                  }
                  className="select text-sm flex-1"
                >
                  <option value="">
                    Choisir un instructeur...
                  </option>

                  {(instructeurs || []).map((u: any) => (
                    <option
                      key={u.id}
                      value={u.id}
                    >
                      {u.nom} ({u.email})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() =>
                    idInstructeur &&
                    affecterMutation.mutate(
                      Number(idInstructeur),
                    )
                  }
                  disabled={
                    !idInstructeur ||
                    affecterMutation.isPending
                  }
                  className="btn-primary text-sm"
                >
                  {affecterMutation.isPending ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    'Affecter'
                  )}
                </button>
              </div>

              {affecterMutation.isError && (
                <p className="mt-3 text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  {(affecterMutation.error as any)
                    ?.response?.data?.detail ||
                    'Affectation impossible'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}