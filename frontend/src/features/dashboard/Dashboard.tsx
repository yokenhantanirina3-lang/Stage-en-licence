import { useQuery } from '@tanstack/react-query'
import api from '@/features/auth/api'
import { FileText, Users, AlertTriangle, Clock } from 'lucide-react'

export default function Dashboard() {
  const { data: reclamations } = useQuery({
    queryKey: ['reclamations'],
    queryFn: () => api.get('/api/v1/reclamations/?size=100').then((r) => r.data),
  })

  const stats = {
    total: reclamations?.total || 0,
    enCours: reclamations?.items?.filter((r: any) =>
      ['EN_INSTRUCTION', 'EN_ATTENTE_PIECES', 'PROJET_REPONSE'].includes(r.statut)
    ).length || 0,
    retard: reclamations?.items?.filter((r: any) =>
      r.date_limite_reponse && new Date(r.date_limite_reponse) < new Date() &&
      !['CLOTUREE', 'NOTIFIEE', 'REJETEE'].includes(r.statut)
    ).length || 0,
    cloturees: reclamations?.items?.filter((r: any) =>
      r.statut === 'CLOTUREE' || r.statut === 'NOTIFIEE'
    ).length || 0,
  }

  const cards = [
    { label: 'Total Reclamations', value: stats.total, icon: FileText, color: 'bg-primary-500' },
    { label: 'En cours de traitement', value: stats.enCours, icon: Clock, color: 'bg-blue-500' },
    { label: 'En retard', value: stats.retard, icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'Cloturees', value: stats.cloturees, icon: Users, color: 'bg-green-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Dernieres reclamations</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">N Dossier</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date depot</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Statut</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Montant</th>
              </tr>
            </thead>
            <tbody>
              {reclamations?.items?.slice(0, 10).map((r: any) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{r.numero_dossier}</td>
                  <td className="py-3 px-4">{new Date(r.date_depot).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      r.statut === 'CLOTUREE' ? 'bg-green-100 text-green-800' :
                      r.statut === 'EN_INSTRUCTION' ? 'bg-blue-100 text-blue-800' :
                      r.statut === 'EN_ATTENTE_PIECES' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {r.statut}
                    </span>
                  </td>
                  <td className="py-3 px-4">{r.montant_concerne ? `${Number(r.montant_concerne).toLocaleString()} DA` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
