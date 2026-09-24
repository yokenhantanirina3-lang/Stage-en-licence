import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { Plus, Search, Filter, FileSpreadsheet, FileText as FileIcon, BarChart3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { filtrerTexte } from '@/lib/validation'
import { SkeletonTable } from '@/components/Skeleton'
import PageHero from '@/components/PageHero'
import Pagination from '@/components/Pagination'
import EmptyState from '@/components/EmptyState'

const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'ENREGISTREE', label: 'Enregistrée' },
  { value: 'A_QUALIFIER', label: 'À qualifier' },
  { value: 'EN_INSTRUCTION', label: 'En instruction' },
  { value: 'EN_ATTENTE_PIECES', label: 'En attente pièces' },
  { value: 'PROJET_REPONSE', label: 'Projet réponse' },
  { value: 'EN_VALIDATION', label: 'En validation' },
  { value: 'EN_VISA_DIRECTEUR', label: 'Visa directeur' },
  { value: 'SIGNEE', label: 'Signée' },
  { value: 'NOTIFIEE', label: 'Notifiée' },
  { value: 'CLOTUREE', label: 'Clôturée' },
  { value: 'REJETEE', label: 'Rejetée' },
]

const STATUT_STYLE: Record<string, { bg: string; dot: string; text: string }> = {
  ENREGISTREE:    { bg: 'bg-slate-50',     dot: 'bg-slate-400',     text: 'text-slate-700' },
  A_QUALIFIER:    { bg: 'bg-amber-50',     dot: 'bg-amber-400',     text: 'text-amber-700' },
  EN_INSTRUCTION: { bg: 'bg-brand-50',     dot: 'bg-brand-400',     text: 'text-brand-700' },
  EN_ATTENTE_PIECES: { bg: 'bg-amber-100', dot: 'bg-amber-500',    text: 'text-amber-800' },
  PROJET_REPONSE: { bg: 'bg-brand-100',    dot: 'bg-brand-500',     text: 'text-brand-800' },
  EN_VALIDATION:  { bg: 'bg-emerald-50',   dot: 'bg-emerald-400',   text: 'text-emerald-700' },
  EN_VISA_DIRECTEUR: { bg: 'bg-brand-100', dot: 'bg-brand-600',     text: 'text-brand-800' },
  SIGNEE:         { bg: 'bg-emerald-100',  dot: 'bg-emerald-500',   text: 'text-emerald-800' },
  NOTIFIEE:       { bg: 'bg-emerald-50',   dot: 'bg-emerald-400',   text: 'text-emerald-700' },
  CLOTUREE:       { bg: 'bg-emerald-50',   dot: 'bg-emerald-400',   text: 'text-emerald-700' },
  REJETEE:        { bg: 'bg-amber-100',    dot: 'bg-amber-600',     text: 'text-amber-900' },
}

const STATUT_FR: Record<string, string> = {
  ENREGISTREE: 'Enregistrée',
  A_QUALIFIER: 'À qualifier',
  EN_INSTRUCTION: 'En instruction',
  EN_ATTENTE_PIECES: 'En attente pièces',
  PROJET_REPONSE: 'Projet réponse',
  EN_VALIDATION: 'En validation',
  EN_VISA_DIRECTEUR: 'Visa directeur',
  SIGNEE: 'Signée',
  NOTIFIEE: 'Notifiée',
  CLOTUREE: 'Clôturée',
  REJETEE: 'Rejetée',
}

function BadgeStatut({ statut }: { statut: string }) {
  const s = STATUT_STYLE[statut]
  if (!s) return <span className="badge bg-surface-100 text-surface-600 border border-surface-200/60">{statut}</span>
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.bg} ${s.text} border border-transparent`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {STATUT_FR[statut] || statut}
    </span>
  )
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
    <div className="space-y-6">
      {/* Hero Header */}
      <PageHero
        kicker="Gestion des réclamations"
        icon={<BarChart3 size={16} className="text-brand-200" />}
        title="Réclamations"
        subtitle={`${data?.total || 0} résultat${(data?.total || 0) > 1 ? 's' : ''}`}
        actions={
          <>
            <button onClick={() => handleExport('xlsx')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl font-medium text-sm border border-white/20 hover:bg-white/20 transition-all duration-200">
              <FileSpreadsheet size={15} />
              Excel
            </button>
            <button onClick={() => handleExport('csv')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl font-medium text-sm border border-white/20 hover:bg-white/20 transition-all duration-200">
              <FileIcon size={15} />
              CSV
            </button>
            {peutCreer && (
              <Link to="/app/reclamations/nouvelle" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                <Plus size={16} />
                Nouvelle
              </Link>
            )}
          </>
        }
      />

      {/* Filters */}
      <div className="card p-5" style={{ animation: 'slideUp 0.5s ease-out 0.1s backwards' }}>
        <div className="space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro ou référence..."
              value={search}
              onChange={(e) => setSearch(filtrerTexte(e.target.value))}
              className="input pl-11"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className="select pl-9 pr-8">
                {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className="select">
              <option value="">Tous les types</option>
              {types?.map((t: any) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
            </select>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="input" title="Date début" />
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="input" title="Date fin" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : (
      <div className="card overflow-hidden" style={{ animation: 'slideUp 0.5s ease-out 0.2s backwards' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200/80">
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">N° Dossier</th>
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">Type</th>
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">Dépôt</th>
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">Limite</th>
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">Statut</th>
                <th className="text-right text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <EmptyState
                      title="Aucune réclamation"
                      description="Aucun résultat ne correspond à vos critères de recherche"
                    />
                  </td>
                </tr>
              ) : (
                data?.items?.map((r: any, i: number) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/reclamations/${r.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/reclamations/${r.id}`)
                      }
                    }}
                    role="link"
                    tabIndex={0}
                    aria-label={`Ouvrir le dossier ${r.numero_dossier}`}
                    className="group cursor-pointer transition-all duration-200 hover:bg-brand-50/40 focus-visible:bg-brand-50/40 focus-visible:outline-none"
                    style={{ animation: 'fadeIn 0.4s ease-out backwards', animationDelay: `${0.3 + i * 0.03}s` }}
                  >
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-brand-600 group-hover:text-brand-700 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {r.numero_dossier}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-medium text-surface-600">{r.type?.libelle || '—'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-surface-700 tabular-nums">{new Date(r.date_depot).toLocaleDateString('fr-FR')}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-sm tabular-nums ${r.date_limite_reponse ? 'text-surface-500' : 'text-surface-400'}`}>
                        {r.date_limite_reponse ? new Date(r.date_limite_reponse).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <BadgeStatut statut={r.statut} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-sm font-bold text-surface-800 tabular-nums">
                        {r.montant_concerne ? `${Number(r.montant_concerne).toLocaleString()} Ar` : '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > 15 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={data.total}
            onChange={setPage}
          />
        )}
      </div>
      )}
    </div>
  )
}