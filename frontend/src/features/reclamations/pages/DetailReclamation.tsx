import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { ArrowLeft } from 'lucide-react'
import OngletPieces from '../components/OngletPieces'
import OngletDecision from '../components/OngletDecision'
import OngletHistorique from '../components/OngletHistorique'

const statutStyles: Record<string, string> = {
  ENREGISTREE: 'bg-gray-100 text-gray-800',
  A_QUALIFIER: 'bg-orange-100 text-orange-800',
  EN_INSTRUCTION: 'bg-blue-100 text-blue-800',
  EN_ATTENTE_PIECES: 'bg-yellow-100 text-yellow-800',
  PROJET_REPONSE: 'bg-indigo-100 text-indigo-800',
  EN_VALIDATION: 'bg-cyan-100 text-cyan-800',
  EN_VISA_DIRECTEUR: 'bg-teal-100 text-teal-800',
  SIGNEE: 'bg-lime-100 text-lime-800',
  NOTIFIEE: 'bg-purple-100 text-purple-800',
  CLOTUREE: 'bg-green-100 text-green-800',
  REJETEE: 'bg-red-100 text-red-800',
  CONTENTIEUX_JUDICIAIRE: 'bg-rose-100 text-rose-800',
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  )
}

const ONGLETS = [
  { id: 'infos', label: 'Informations' },
  { id: 'pieces', label: 'Pieces' },
  { id: 'decision', label: 'Decision' },
  { id: 'historique', label: 'Historique' },
] as const

export default function DetailReclamation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [ongletActif, setOngletActif] = useState<(typeof ONGLETS)[number]['id']>('infos')
  const [idType, setIdType] = useState('')
  const [idMotif, setIdMotif] = useState('')

  const { data: rec, isLoading } = useQuery({
    queryKey: ['reclamation', id],
    queryFn: () => api.get(`/api/v1/reclamations/${id}`).then((r) => r.data),
  })

  const { data: types } = useQuery({
    queryKey: ['types-reclamation'],
    queryFn: () => api.get('/api/v1/reclamations/types').then((r) => r.data),
  })

  const { data: motifs } = useQuery({
    queryKey: ['motifs-reclamation', idType],
    queryFn: () =>
      api
        .get('/api/v1/reclamations/motifs', { params: { id_type: Number(idType) } })
        .then((r) => r.data),
    enabled: !!idType,
  })

  const qualifierMutation = useMutation({
    mutationFn: (data: { id_type: number; id_motif: number }) =>
      api.patch(`/api/v1/reclamations/${id}/qualifier`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reclamation', id] })
      queryClient.invalidateQueries({ queryKey: ['reclamations'] })
      queryClient.invalidateQueries({ queryKey: ['historique', id] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!rec) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Reclamation introuvable</p>
        <button onClick={() => navigate('/reclamations')} className="text-primary-600 hover:underline">
          Retour a la liste
        </button>
      </div>
    )
  }

  const role = user?.role?.libelle
  const peutQualifier =
    ['ADMIN', 'SAISIE', 'INSTRUCTEUR'].includes(role || '') &&
    ['ENREGISTREE', 'A_QUALIFIER'].includes(rec.statut)

  const handleQualifier = (e: React.FormEvent) => {
    e.preventDefault()
    qualifierMutation.mutate({ id_type: parseInt(idType), id_motif: parseInt(idMotif) })
  }

  return (
    <div>
      <button
        onClick={() => navigate('/reclamations')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">{rec.numero_dossier}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Deposee le {new Date(rec.date_depot).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statutStyles[rec.statut] || 'bg-gray-100 text-gray-800'}`}>
          {rec.statut}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex gap-1 mb-4 border-b border-gray-200">
            {ONGLETS.map((o) => (
              <button
                key={o.id}
                onClick={() => setOngletActif(o.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  ongletActif === o.id
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {ongletActif === 'infos' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Informations</h2>
                <InfoRow label="Contribuable" value={`#${rec.id_contribuable}`} />
                <InfoRow label="Canal d'entree" value={rec.canal_entree} />
                <InfoRow label="Reference imposition" value={rec.reference_imposition || '-'} />
                <InfoRow
                  label="Montant concerne"
                  value={rec.montant_concerne ? `${Number(rec.montant_concerne).toLocaleString('fr-FR')} DA` : '-'}
                />
                <InfoRow label="Date limite de reponse" value={
                  rec.date_limite_reponse
                    ? new Date(rec.date_limite_reponse).toLocaleDateString('fr-FR')
                    : 'Non definie (non qualifiee)'
                } />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Resume des faits</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {rec.resume_faits || 'Aucun resume fourni.'}
                </p>
              </div>
            </div>
          )}

          {ongletActif === 'pieces' && <OngletPieces reclamationId={id!} />}
          {ongletActif === 'decision' && (
            <OngletDecision reclamationId={id!} statutReclamation={rec.statut} role={role} />
          )}
          {ongletActif === 'historique' && <OngletHistorique reclamationId={id!} />}
        </div>

        <div className="space-y-6">
          {peutQualifier && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Qualifier la reclamation</h2>
              <form onSubmit={handleQualifier} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={idType}
                    onChange={(e) => {
                      setIdType(e.target.value)
                      setIdMotif('')
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">Choisir un type...</option>
                    {types?.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.libelle} ({t.delai_legal_jours} j)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                  <select
                    value={idMotif}
                    onChange={(e) => setIdMotif(e.target.value)}
                    required
                    disabled={!idType}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">
                      {idType ? 'Choisir un motif...' : 'Choisissez un type dabord'}
                    </option>
                    {motifs?.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.libelle}
                      </option>
                    ))}
                  </select>
                </div>

                {qualifierMutation.isError && (
                  <p className="text-xs text-red-600">
                    {(qualifierMutation.error as any)?.response?.data?.detail || 'Erreur lors de la qualification'}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={qualifierMutation.isPending}
                  className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium text-sm"
                >
                  {qualifierMutation.isPending ? 'Qualification...' : 'Qualifier'}
                </button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Suivi</h2>
            <InfoRow label="Type" value={rec.id_type ? `#${rec.id_type}` : 'Non qualifie'} />
            <InfoRow label="Motif" value={rec.id_motif ? `#${rec.id_motif}` : '-'} />
            <InfoRow label="Cree le" value={new Date(rec.created_at).toLocaleString('fr-FR')} />
            <InfoRow label="Modifie le" value={new Date(rec.updated_at).toLocaleString('fr-FR')} />
          </div>
        </div>
      </div>
    </div>
  )
}
