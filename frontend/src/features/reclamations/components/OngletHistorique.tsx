import { useQuery } from '@tanstack/react-query'
import api from '@/features/auth/api'

const actionStyles: Record<string, string> = {
  CREATION: 'bg-gray-100 text-gray-800',
  QUALIFICATION: 'bg-orange-100 text-orange-800',
  DEMANDE_PIECES: 'bg-yellow-100 text-yellow-800',
  RECEPTION_PIECES: 'bg-lime-100 text-lime-800',
  REDACTION: 'bg-blue-100 text-blue-800',
  AVIS_CHEF: 'bg-cyan-100 text-cyan-800',
  VISA_DIR: 'bg-teal-100 text-teal-800',
  SIGNATURE: 'bg-purple-100 text-purple-800',
  ENVOI: 'bg-indigo-100 text-indigo-800',
  CLOTURE: 'bg-green-100 text-green-800',
  ALERTE_DELAI: 'bg-red-100 text-red-800',
}

export default function OngletHistorique({ reclamationId }: { reclamationId: string }) {
  const { data: actions, isLoading } = useQuery({
    queryKey: ['historique', reclamationId],
    queryFn: () => api.get(`/api/v1/reclamations/${reclamationId}/historique`).then((r) => r.data),
  })

  if (isLoading) {
    return <p className="text-sm text-gray-400">Chargement...</p>
  }

  if (!actions || actions.length === 0) {
    return <p className="text-sm text-gray-400">Aucune action enregistree</p>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Historique du dossier</h2>
      <ol className="relative border-l border-gray-200 ml-3">
        {actions.map((a: any) => (
          <li key={a.id} className="mb-6 ml-4 last:mb-0">
            <span className="absolute -left-1.5 flex h-3 w-3 rounded-full bg-primary-500 mt-1.5"></span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${actionStyles[a.action] || 'bg-gray-100 text-gray-800'}`}>
                {a.action}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(a.created_at).toLocaleString('fr-FR')}
              </span>
            </div>
            {a.commentaire && (
              <p className="text-sm text-gray-700 mt-1">{a.commentaire}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
