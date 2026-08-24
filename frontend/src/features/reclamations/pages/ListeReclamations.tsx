import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ListeReclamations() {
  const [search, setSearch] = useState('')
  const [recherche, setRecherche] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()

  const peutCreer = ['ADMIN', 'SAISIE', 'INSTRUCTEUR'].includes(user?.role?.libelle || '')

  useEffect(() => {
    const timer = setTimeout(() => setRecherche(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['reclamations', recherche],
    queryFn: () =>
      api
        .get('/api/v1/reclamations/', { params: { size: 50, search: recherche || undefined } })
        .then((r) => r.data),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reclamations</h1>
        {peutCreer && (
          <Link
            to="/reclamations/nouvelle"
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Nouvelle
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un dossier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">N Dossier</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date depot</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date limite</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Statut</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Montant</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Chargement...</td></tr>
              ) : data?.items?.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Aucune reclamation</td></tr>
              ) : (
                data?.items?.map((r: any) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/reclamations/${r.id}`)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono text-xs">{r.numero_dossier}</td>
                    <td className="py-3 px-4">{r.id_type ? `Type ${r.id_type}` : '-'}</td>
                    <td className="py-3 px-4">{new Date(r.date_depot).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3 px-4">{r.date_limite_reponse ? new Date(r.date_limite_reponse).toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        r.statut === 'CLOTUREE' ? 'bg-green-100 text-green-800' :
                        r.statut === 'EN_INSTRUCTION' ? 'bg-blue-100 text-blue-800' :
                        r.statut === 'EN_ATTENTE_PIECES' ? 'bg-yellow-100 text-yellow-800' :
                        r.statut === 'NOTIFIEE' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {r.statut}
                      </span>
                    </td>
                    <td className="py-3 px-4">{r.montant_concerne ? `${Number(r.montant_concerne).toLocaleString()} DA` : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
