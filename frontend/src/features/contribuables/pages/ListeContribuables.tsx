import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'

export default function ListeContribuables() {
  const [search, setSearch] = useState('')
  const { user } = useAuth()

  const peutGerer = ['ADMIN', 'SAISIE'].includes(user?.role?.libelle || '')
  const { data, isLoading } = useQuery({
    queryKey: ['contribuables', search],
    queryFn: () =>
      api
        .get('/api/v1/contribuables/', {
          params: { size: 100, search: search || undefined },
        })
        .then((r) => r.data),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contribuables</h1>
        {peutGerer && (
          <Link
            to="/contribuables/nouvelle"
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Nouveau
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Rechercher par nom ou numero fiscal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">N Fiscal</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Nom / Raison Sociale</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Telephone</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Chargement...</td></tr>
              ) : data?.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Aucun contribuable</td></tr>
              ) : (
                data?.map((c: any) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs">{c.numero_fiscal}</td>
                    <td className="py-3 px-4">{c.nom_raison_sociale}</td>
                    <td className="py-3 px-4">{c.type_contribuable}</td>
                    <td className="py-3 px-4">{c.email || '-'}</td>
                    <td className="py-3 px-4">{c.telephone || '-'}</td>
                    <td className="py-3 px-4">
                      {peutGerer ? (
                        <Link
                          to={`/contribuables/${c.id}/modifier`}
                          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 text-sm"
                        >
                          <Pencil size={14} />
                          Modifier
                        </Link>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
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
