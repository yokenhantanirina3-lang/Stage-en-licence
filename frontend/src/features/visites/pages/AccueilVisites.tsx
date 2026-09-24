import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import {
  DoorOpen, User, Building2, FileText, Clock, CheckCircle2, AlertTriangle,
  Plus, Search, Calendar,
} from 'lucide-react'
import { filtrerTexte } from '@/lib/validation'
import PageHero from '@/components/PageHero'

const SERVICES = ['Accueil', 'Comptabilite', 'Contentieux', 'Recouvrement', 'Cadastre', 'Autre']

const OBJETS_PRINCIPAUX = [
  'Depot de reclamation',
  'Retrait de decision',
  'Renseignements fiscaux',
  'Paiement et quittance',
  'Depot de piece',
  'Autre',
]

const serviceColors: Record<string, string> = {
  Accueil: 'bg-brand-50 text-brand-700 border-brand-100',
  Comptabilite: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Contentieux: 'bg-amber-50 text-amber-700 border-amber-100',
  Recouvrement: 'bg-brand-50 text-brand-700 border-brand-100',
  Cadastre: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Autre: 'bg-surface-100 text-surface-600 border-surface-200',
}

function SuccessToast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 dark:bg-slate-800 text-white pl-4 pr-5 py-4 rounded-2xl shadow-2xl shadow-black/20 border border-white/10" style={{ animation: 'slideUp 0.35s ease-out' }}>
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
        <CheckCircle2 size={18} className="text-white" />
      </div>
      <div>
        <p className="text-sm font-bold">{message}</p>
        <p className="text-xs text-surface-400">Visite enregistree avec succes</p>
      </div>
    </div>
  )
}

export default function AccueilVisites() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    id_contribuable: '',
    nom_visiteur: '',
    objet: '',
    service_destination: 'Accueil',
    notes: '',
  })
  const [error, setError] = useState('')
  const [toast, setToast] = useState(false)

  const peutAjouter = ['ADMIN', 'SAISIE'].includes(user?.role?.libelle || '')

  const { data: stats } = useQuery({
    queryKey: ['visites-stats'],
    queryFn: () => api.get('/api/v1/visites/stats').then((r) => r.data),
    refetchInterval: 60000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['visites', page, search],
    queryFn: () => api.get('/api/v1/visites/', { params: { page, size: 8, jour: search || undefined } }).then((r) => r.data),
  })

  const { data: contribuables } = useQuery({
    queryKey: ['contribuables-select'],
    queryFn: () => api.get('/api/v1/contribuables/?size=300').then((r) => r.data),
  })

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(false), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/visites/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visites'] })
      queryClient.invalidateQueries({ queryKey: ['visites-stats'] })
      setForm({ id_contribuable: '', nom_visiteur: '', objet: '', service_destination: 'Accueil', notes: '' })
      setError('')
      setToast(true)
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || "Echec de l'enregistrement de la visite")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.objet.trim()) {
      setError('Indiquez l objet de la visite.')
      return
    }
    const payload: any = { ...form, objet: form.objet.trim() }
    if (form.id_contribuable) {
      payload.id_contribuable = parseInt(form.id_contribuable)
      delete payload.nom_visiteur
    } else {
      delete payload.id_contribuable
      if (!form.nom_visiteur.trim()) {
        setError('Selectionnez un contribuable ou indiquez le nom du visiteur.')
        return
      }
    }
    mutation.mutate(payload)
  }

  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / 8))
  const statsCards = [
    { label: 'Visites aujourd hui', value: stats?.aujourd_hui || 0, icon: Clock, bg: 'from-brand-500 to-indigo-600' },
    { label: 'Total des visites', value: stats?.total || 0, icon: DoorOpen, bg: 'from-brand-500 to-brand-600' },
  ]

  return (
    <div className="space-y-6">
      {toast && <SuccessToast message="Nouvelle visite enregistree" />}

      {/* Hero Header */}
      <PageHero
        kicker="Relation usager"
        icon={<DoorOpen size={16} className="text-brand-200" />}
        title="Accueil et Visites"
        subtitle="Suivi des receptions et des visiteurs au centre fiscal"
        actions={peutAjouter && (
          <button
            onClick={() => document.getElementById('form-visite')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus size={16} />
            Enregistrer une visite
          </button>
        )}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ animation: 'slideUp 0.5s ease-out 0.1s backwards' }}>
        {statsCards.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center shadow-lg shadow-brand-500/20`}>
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-surface-400 uppercase tracking-widest">{s.label}</p>
                <p className="text-2xl font-extrabold text-surface-900 tabular-nums mt-0.5">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Form */}
      {peutAjouter && (
        <div id="form-visite" className="card p-6" style={{ animation: 'slideUp 0.5s ease-out 0.15s backwards' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-md shadow-brand-500/20">
              <Plus size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-surface-900">Enregistrer une visite</h2>
              <p className="text-xs text-surface-400">Reception d un contribuable ou d un visiteur a l accueil</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Contribuable enregistre (optionnel)</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  <select
                    value={form.id_contribuable}
                    onChange={(e) => { setForm({ ...form, id_contribuable: e.target.value, nom_visiteur: e.target.value ? '' : form.nom_visiteur }) }}
                    className="select pl-9"
                  >
                    <option value="">-- Visiteur non enregistre --</option>
                    {contribuables?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nom_raison_sociale} ({c.numero_fiscal})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Nom du visiteur</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  <input
                    type="text"
                    value={form.nom_visiteur}
                    disabled={!!form.id_contribuable}
                    onChange={(e) => setForm({ ...form, nom_visiteur: filtrerTexte(e.target.value) })}
                    className={`input pl-9 ${form.id_contribuable ? 'opacity-50' : ''}`}
                    placeholder="Nom et prenom du visiteur..."
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Objet de la visite</label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  <select
                    value={form.objet === '' ? '' : (OBJETS_PRINCIPAUX.includes(form.objet) ? form.objet : 'Autre')}
                    onChange={(e) => setForm({ ...form, objet: e.target.value })}
                    className="select pl-9"
                  >
                    <option value="">-- Choisir l objet --</option>
                    {OBJETS_PRINCIPAUX.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Service de destination</label>
                <div className="relative">
                  <DoorOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  <select
                    value={form.service_destination}
                    onChange={(e) => setForm({ ...form, service_destination: e.target.value })}
                    className="select pl-9"
                  >
                    {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {!OBJETS_PRINCIPAUX.includes(form.objet) && form.objet !== '' && (
              <div>
                <label className="label">Precisez l objet</label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  <input
                    type="text"
                    value={form.objet}
                    onChange={(e) => setForm({ ...form, objet: filtrerTexte(e.target.value) })}
                    className="input pl-9"
                    placeholder="Ex : Demandes de prolongation, lettre d information..."
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label">Notes (optionnel)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: filtrerTexte(e.target.value) })}
                rows={2}
                className="input resize-none"
                placeholder="Details complementaires..."
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <AlertTriangle size={15} />
                {typeof error === 'string' ? error : 'Erreur lors de l enregistrement'}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary w-full md:w-auto"
            >
              {mutation.isPending ? 'Enregistrement...' : 'Enregistrer la visite'}
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden" style={{ animation: 'slideUp 0.5s ease-out 0.2s backwards' }}>
        <div className="border-b border-surface-200/80 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-surface-900">Registre des visites</h2>
            <p className="text-xs text-surface-400 mt-0.5">{data?.total || 0} visite{(data?.total || 0) > 1 ? 's' : ''} enregistree{(data?.total || 0) > 1 ? 's' : ''}</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="date"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="input pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200/80">
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">NÂ° Visite</th>
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">Visiteur</th>
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">Objet</th>
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">Service</th>
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">Recu par</th>
                <th className="text-left text-[11px] font-bold text-surface-400 uppercase tracking-widest py-4 px-6">Date</th>
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
                      <span className="text-sm font-medium text-surface-400">Chargement des visites...</span>
                    </div>
                  </td>
                </tr>
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-50 flex items-center justify-center">
                        <DoorOpen size={26} className="text-surface-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-surface-700 text-base">Aucune visite</p>
                        <p className="text-sm text-surface-400 mt-1">Aucune visite {search ? 'a cette date' : 'enregistree pour le moment'}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.items?.map((v: any, i: number) => (
                  <tr
                    key={v.id}
                    className="group transition-all duration-200 hover:bg-brand-50/40"
                    style={{ animation: 'fadeIn 0.4s ease-out backwards', animationDelay: `${0.3 + i * 0.03}s` }}
                  >
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-brand-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {v.numero}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110">
                          <User size={15} className="text-surface-500" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-surface-900">
                            {v.contribuable ? v.contribuable.nom_raison_sociale : (v.nom_visiteur || 'â€”')}
                          </span>
                          {v.contribuable && (
                            <p className="text-xs text-surface-400 font-mono">{v.contribuable.numero_fiscal}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-surface-700">{v.objet}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        serviceColors[v.service_destination] || serviceColors.Autre
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          v.service_destination === 'Contentieux' ? 'bg-amber-400' :
                          v.service_destination === 'Accueil' ? 'bg-brand-400' : 'bg-surface-400'
                        }`} />
                        {v.service_destination}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 text-surface-600">
                        {v.agent_recepteur ? v.agent_recepteur.nom : 'â€”'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 text-xs text-surface-500">
                        <Calendar size={13} className="text-surface-400" />
                        {new Date(v.date_visite).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && (data?.total || 0) > 8 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-200/80">
            <p className="text-xs text-surface-400">
              Page {page} sur {totalPages}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    p === page
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                      : 'text-surface-500 hover:bg-brand-50 hover:text-brand-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
