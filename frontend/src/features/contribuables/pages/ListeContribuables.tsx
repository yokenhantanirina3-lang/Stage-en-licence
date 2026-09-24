import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { useState } from 'react'
import { Plus, Pencil, Search, Building2, User, BarChart3 } from 'lucide-react'
import { filtrerTexte } from '@/lib/validation'
import PageHero from '@/components/PageHero'
import EmptyState from '@/components/EmptyState'

export default function ListeContribuables() {
  const [search, setSearch] = useState('')
  const { user } = useAuth()

  const peutGerer = ['ADMIN', 'SAISIE'].includes(user?.role?.libelle || '')
  const { data, isLoading } = useQuery({
    queryKey: ['contribuables', search],
    queryFn: () => api.get('/api/v1/contribuables/', { params: { size: 100, search: search || undefined } }).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <PageHero
        kicker="Répertoire fiscal"
        icon={<BarChart3 size={16} className="text-brand-200" />}
        title="Contribuables"
        subtitle={`${data?.length || 0} contribuable${(data?.length || 0) > 1 ? 's' : ''}`}
        actions={peutGerer && (
          <Link to="/app/contribuables/nouvelle" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
            <Plus size={16} />
            Nouveau
          </Link>
        )}
      />

      {/* Search */}
      <div className="card p-5" style={{ animation: 'slideUp 0.5s ease-out 0.1s backwards' }}>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input type="text" placeholder="Rechercher par nom ou numéro fiscal..." value={search} onChange={(e) => setSearch(filtrerTexte(e.target.value))} className="input pl-11" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden" style={{ animation: 'slideUp 0.5s ease-out 0.2s backwards' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200/80">
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">N° Fiscal</th>
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">Nom / Raison Sociale</th>
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">Type</th>
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">Email</th>
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">Téléphone</th>
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-[3px] border-brand-100" />
                        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-brand-500 animate-spin" />
                      </div>
                      <span className="text-sm font-medium text-surface-400">Chargement des contribuables...</span>
                    </div>
                  </td>
                </tr>
              ) : data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <EmptyState
                      title="Aucun contribuable"
                      description="Commencez par en ajouter un nouveau"
                    />
                  </td>
                </tr>
              ) : (
                data?.map((c: any, i: number) => (
                  <tr
                    key={c.id}
                    className="group transition-all duration-200 hover:bg-brand-50/40"
                    style={{ animation: 'fadeIn 0.4s ease-out backwards', animationDelay: `${0.3 + i * 0.03}s` }}
                  >
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-brand-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {c.numero_fiscal}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm ${
                          c.type_contribuable === 'MORALE' ? 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/20' : 'bg-gradient-to-br from-brand-400 to-brand-500 shadow-brand-500/20'
                        }`}>
                          {c.type_contribuable === 'MORALE' ? <Building2 size={15} className="text-white" /> : <User size={15} className="text-white" />}
                        </div>
                        <span className="font-semibold text-surface-900 group-hover:text-brand-700 transition-colors">{c.nom_raison_sociale}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-transparent ${
                        c.type_contribuable === 'MORALE' ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.type_contribuable === 'MORALE' ? 'bg-amber-400' : 'bg-brand-400'}`} />
                        {c.type_contribuable === 'MORALE' ? 'Morale' : 'Physique'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-sm ${c.email ? 'text-surface-600' : 'text-surface-400'}`}>{c.email || '—'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-sm ${c.telephone ? 'text-surface-600' : 'text-surface-400'}`}>{c.telephone || '—'}</span>
                    </td>
                    <td className="py-4 px-6">
                      {peutGerer ? (
                        <Link to={`/app/contribuables/${c.id}/modifier`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-100 hover:border-brand-200 transition-all duration-200">
                          <Pencil size={12} />
                          Modifier
                        </Link>
                      ) : (
                        <span className="text-surface-400">—</span>
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
