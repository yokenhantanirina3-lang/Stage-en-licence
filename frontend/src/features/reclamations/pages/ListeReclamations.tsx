import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { Plus, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'ENREGISTREE', label: 'Enregistree' },
  { value: 'A_QUALIFIER', label: 'A qualifier' },
  { value: 'EN_INSTRUCTION', label: 'En instruction' },
  { value: 'EN_ATTENTE_PIECES', label: 'En attente pieces' },
  { value: 'PROJET_REPONSE', label: 'Projet reponse' },
  { value: 'EN_VALIDATION', label: 'En validation' },
  { value: 'EN_VISA_DIRECTEUR', label: 'Visa directeur' },
  { value: 'SIGNEE', label: 'Signee' },
  { value: 'NOTIFIEE', label: 'Notifiee' },
  { value: 'CLOTUREE', label: 'Cloturee' },
  { value: 'REJETEE', label: 'Rejetee' },
]

const STATUT_COLORS: Record<string, string> = {
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
}

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

export default function ListeReclamations() {
  const [search, setSearch] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [filtreType, setFiltreType] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const { user } = useAuth()

  const peutCreer = ['ADMIN', 'SAISIE', 'INSTRUCTEUR'].includes(user?.role?.libelle || '')

  useEffect(() => {
    const timer = setTimeout(() => { setRecherche(search); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => { setPage(1) }, [filtreStatut, filtreType, dateDebut, dateFin])

  const params: any = { page, size: 15, search: recherche || undefined, statut: filtreStatut || undefined, id_type: filtreType || undefined, date_debut: dateDebut || undefined, date_fin: dateFin || undefined }

  const { data, isLoading } = useQuery({
    queryKey: ['reclamations', recherche, filtreStatut, filtreType, dateDebut, dateFin, page],
    queryFn: () => api.get('/api/v1/reclamations/', { params }).then((r) => r.data),
  })

  const { data: types } = useQuery({
    queryKey: ['types-reclamation'],
    queryFn: () => api.get('/api/v1/reclamations/types').then((r) => r.data),
  })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / 15)) : 1

  const handleExport = (format: string) => {
    const exportParams = new URLSearchParams()
    if (filtreStatut) exportParams.set('statut', filtreStatut)
    if (filtreType) exportParams.set('id_type', filtreType)
    if (dateDebut) exportParams.set('date_debut', dateDebut)
    if (dateFin) exportParams.set('date_fin', dateFin)
    const url = `/api/v1/reclamations/export?format=${format}&${exportParams.toString()}`
    const token = localStorage.getItem('access_token')
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `reclamations.${format}`
        a.click()
      })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reclamations</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => handleExport('xlsx')} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            <Download size={14} />
            Excel
          </button>
          <button onClick={() => handleExport('csv')} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            <Download size={14} />
            CSV
          </button>
          {peutCreer && (
            <Link to="/reclamations/nouvelle" className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
              <Plus size={16} />
              Nouvelle
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numero ou reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option value="">Tous les types</option>
              {types?.map((t: any) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
            </select>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" title="Date debut" />
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" title="Date fin" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">N Dossier</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Depot</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Limite</th>
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
                  <tr key={r.id} onClick={() => navigate(`/reclamations/${r.id}`)} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <td className="py-3 px-4 font-mono text-xs">{r.numero_dossier}</td>
                    <td className="py-3 px-4 text-xs">{r.type?.libelle || '-'}</td>
                    <td className="py-3 px-4">{new Date(r.date_depot).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3 px-4">{r.date_limite_reponse ? new Date(r.date_limite_reponse).toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[r.statut] || 'bg-gray-100 text-gray-800'}`}>
                        {STATUT_FR[r.statut] || r.statut}
                      </span>
                    </td>
                    <td className="py-3 px-4">{r.montant_concerne ? `${Number(r.montant_concerne).toLocaleString()} DA` : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > 15 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">
              {data.total} resultats, page {page}/{totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
