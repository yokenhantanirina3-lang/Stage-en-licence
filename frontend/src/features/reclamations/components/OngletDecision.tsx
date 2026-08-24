import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/features/auth/api'

const TYPES_DECISION = ['ADMIS_TOTAL', 'ADMIS_PARTIEL', 'REJETE', 'IRRECEVABLE', 'CADUC']

const statutDecisionStyles: Record<string, string> = {
  BROUILLON: 'bg-gray-100 text-gray-800',
  VALIDEE: 'bg-blue-100 text-blue-800',
  SIGNEE: 'bg-purple-100 text-purple-800',
  NOTIFIEE: 'bg-green-100 text-green-800',
}

interface Props {
  reclamationId: string
  statutReclamation: string
  role?: string
}

export default function OngletDecision({ reclamationId, statutReclamation, role }: Props) {
  const queryClient = useQueryClient()
  const [avis, setAvis] = useState('FAVORABLE')
  const [form, setForm] = useState({
    type_decision: 'ADMIS_PARTIEL',
    fondement_juridique: '',
    motivation: '',
    montant_accorde: '0',
    montant_rejete: '0',
  })

  const isAdmin = role === 'ADMIN'
  const isInstructeur = role === 'INSTRUCTEUR' || isAdmin
  const isChef = role === 'CHEF' || isAdmin
  const isDirecteur = role === 'DIRECTEUR' || isAdmin

  const peutRediger =
    isInstructeur &&
    ['EN_INSTRUCTION', 'EN_ATTENTE_PIECES', 'PROJET_REPONSE'].includes(statutReclamation)

  const { data: decision, isLoading } = useQuery({
    queryKey: ['decision', reclamationId],
    queryFn: () =>
      api
        .get(`/api/v1/reclamations/${reclamationId}/decision`)
        .then((r) => r.data)
        .catch((err) => (err.response?.status === 404 ? null : Promise.reject(err))),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['decision', reclamationId] })
    queryClient.invalidateQueries({ queryKey: ['reclamation', reclamationId] })
    queryClient.invalidateQueries({ queryKey: ['historique', reclamationId] })
    queryClient.invalidateQueries({ queryKey: ['reclamations'] })
  }

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(`/api/v1/reclamations/${reclamationId}/decision`, data),
    onSuccess: invalidate,
  })

  const actionMutation = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: any }) =>
      api.post(`/api/v1/decisions/${decision.id}/${path}`, body || {}),
    onSuccess: invalidate,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...form,
      montant_accorde: parseFloat(form.montant_accorde) || 0,
      montant_rejete: parseFloat(form.montant_rejete) || 0,
    })
  }

  if (isLoading) return <p className="text-sm text-gray-400">Chargement...</p>

  if (!decision && !peutRediger) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-sm text-gray-400">Aucune decision pour le moment</p>
      </div>
    )
  }

  if (!decision) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Rediger la decision</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de decision</label>
              <select
                value={form.type_decision}
                onChange={(e) => setForm({ ...form, type_decision: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {TYPES_DECISION.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant accorde (DA)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.montant_accorde}
                onChange={(e) => setForm({ ...form, montant_accorde: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant rejete (DA)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.montant_rejete}
                onChange={(e) => setForm({ ...form, montant_rejete: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fondement juridique</label>
            <input
              type="text"
              required
              value={form.fondement_juridique}
              onChange={(e) => setForm({ ...form, fondement_juridique: e.target.value })}
              placeholder="Ex : Art. 72 CIDTA"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivation</label>
            <textarea
              required
              rows={5}
              value={form.motivation}
              onChange={(e) => setForm({ ...form, motivation: e.target.value })}
              placeholder="Motivation de la decision..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          {createMutation.isError && (
            <p className="text-xs text-red-600">
              {(createMutation.error as any)?.response?.data?.detail || 'Erreur'}
            </p>
          )}

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
          >
            {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer le projet'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Decision</h2>
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statutDecisionStyles[decision.statut] || 'bg-gray-100 text-gray-800'}`}>
            {decision.statut}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div><span className="text-gray-500">Type :</span> <span className="font-medium">{decision.type_decision}</span></div>
          <div><span className="text-gray-500">Date :</span> <span className="font-medium">{new Date(decision.date_decision).toLocaleDateString('fr-FR')}</span></div>
          <div><span className="text-gray-500">Montant accorde :</span> <span className="font-medium text-green-700">{Number(decision.montant_accorde).toLocaleString('fr-FR')} DA</span></div>
          <div><span className="text-gray-500">Montant rejete :</span> <span className="font-medium text-red-700">{Number(decision.montant_rejete).toLocaleString('fr-FR')} DA</span></div>
        </div>

        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Fondement juridique</p>
          <p className="text-sm text-gray-900">{decision.fondement_juridique}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Motivation</p>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{decision.motivation}</p>
        </div>
      </div>

      {(actionMutation.isPending || actionMutation.isError) && (
        <div className={`text-sm ${actionMutation.isError ? 'text-red-600' : 'text-gray-500'}`}>
          {actionMutation.isError
            ? (actionMutation.error as any)?.response?.data?.detail || 'Erreur'
            : 'Traitement...'}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {decision.statut === 'BROUILLON' && isInstructeur && (
          <button
            onClick={() => actionMutation.mutate({ path: 'soumettre', body: {} })}
            disabled={actionMutation.isPending}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
          >
            Soumettre a validation
          </button>
        )}

        {decision.statut === 'BROUILLON' && isChef && (
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-1.5">
            <select
              value={avis}
              onChange={(e) => setAvis(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm outline-none"
            >
              <option value="FAVORABLE">Favorable</option>
              <option value="DEFAVORABLE">Defavorable</option>
            </select>
            <button
              onClick={() => actionMutation.mutate({ path: 'valider', body: { avis } })}
              disabled={actionMutation.isPending}
              className="bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
            >
              Valider
            </button>
          </div>
        )}

        {decision.statut === 'VALIDEE' && isDirecteur && (
          <>
            <button
              onClick={() => actionMutation.mutate({ path: 'visa', body: {} })}
              disabled={actionMutation.isPending}
              className="border border-teal-600 text-teal-700 px-4 py-2 rounded-lg hover:bg-teal-50 disabled:opacity-50 text-sm font-medium"
            >
              Apposer le visa
            </button>
            <button
              onClick={() => actionMutation.mutate({ path: 'signer', body: {} })}
              disabled={actionMutation.isPending}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
            >
              Signer la decision
            </button>
          </>
        )}

        {decision.statut === 'SIGNEE' && (isChef || isDirecteur) && (
          <button
            onClick={() => actionMutation.mutate({ path: 'notifier' })}
            disabled={actionMutation.isPending}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
          >
            Notifier et cloturer
          </button>
        )}
      </div>
    </div>
  )
}
