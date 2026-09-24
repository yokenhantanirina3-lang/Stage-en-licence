import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/features/auth/api'
import {
  Settings, Building2, Tags, FileStack, Plus, Pencil, Save, X,
  UserRound, CheckCircle2, XCircle,
} from 'lucide-react'
import TextField from '@/components/TextField'
import PageHero from '@/components/PageHero'

const TYPE_CODES = [
  { value: 'CONTENTIEUSE', label: 'Reclamation contentieuse' },
  { value: 'GRACIEUSE', label: 'Reclamation gracieuse' },
  { value: 'PRESCRIPTION', label: 'Reclamation en prescription' },
]

type Tab = 'types' | 'motifs' | 'services'

function Badge({ children, color = 'bg-brand-50 text-brand-700 border-brand-200/60' }: { children: React.ReactNode; color?: string }) {
  return <span className={`badge text-[11px] border ${color}`}>{children}</span>
}

export default function Referentiels() {
  const [tab, setTab] = useState<Tab>('types')

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Administration"
        icon={<Settings size={16} className="text-brand-200" />}
        title="Referentiels"
        subtitle="Services, types et motifs de reclamation"
      />

      <div className="flex gap-2 flex-wrap">
        {(['types', 'motifs', 'services'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === t
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                : 'bg-white text-surface-600 border border-surface-200 hover:border-brand-300'
            }`}
          >
            {t === 'types' && <Tags size={15} />}
            {t === 'motifs' && <FileStack size={15} />}
            {t === 'services' && <Building2 size={15} />}
            {t === 'types' ? 'Types' : t === 'motifs' ? 'Motifs' : 'Services'}
          </button>
        ))}
      </div>

      {tab === 'types' && <TypesTab />}
      {tab === 'motifs' && <MotifsTab />}
      {tab === 'services' && <ServicesTab />}
    </div>
  )
}

/* ---------------- TYPES ---------------- */

function TypesTab() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ code: 'CONTENTIEUSE', libelle: '', delai_legal_jours: '' })
  const [editForm, setEditForm] = useState({ libelle: '', delai_legal_jours: '' })

  const { data: types, isLoading } = useQuery({
    queryKey: ['admin-types'],
    queryFn: () => api.get('/api/v1/admin/types-reclamation').then((r) => r.data),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-types'] })
    queryClient.invalidateQueries({ queryKey: ['admin-motifs'] })
    queryClient.invalidateQueries({ queryKey: ['reclamation-types'] })
  }

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/admin/types-reclamation', data),
    onSuccess: () => { invalidate(); setShowForm(false); setForm({ code: 'CONTENTIEUSE', libelle: '', delai_legal_jours: '' }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/api/v1/admin/types-reclamation/${id}`, data),
    onSuccess: () => { invalidate(); setEditing(null) },
  })

  const toggleActif = (t: any) =>
    updateMutation.mutate({ id: t.id, data: { actif: !t.actif } })

  return (
    <div className="card p-6" style={{ animation: 'slideUp 0.5s ease-out' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Tags size={18} className="text-white" />
          </div>
          <h2 className="section-title">Types de reclamation</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <><X size={15} /> Annuler</> : <><Plus size={15} /> Nouveau type</>}
        </button>
      </div>

      {(showForm || editing) && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (editing) {
              updateMutation.mutate({ id: editing.id, data: { ...editForm, delai_legal_jours: parseInt(editForm.delai_legal_jours) } })
            } else {
              createMutation.mutate({ ...form, delai_legal_jours: parseInt(form.delai_legal_jours), code: form.code })
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-surface-50 border border-surface-100 mb-6"
        >
          {!editing && (
            <div>
              <label className="label">Code</label>
              <select className="select" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}>
                {TYPE_CODES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          )}
          <div>
            <TextField
              label="Libelle"
              required
              value={editing ? editForm.libelle : form.libelle}
              onChange={(v) => editing ? setEditForm({ ...editForm, libelle: v }) : setForm({ ...form, libelle: v })}
              icon={<Tags size={16} />}
            />
          </div>
          <div>
            <label className="label">Delai legal (jours)</label>
            <input
              type="number" min={1} required className="input"
              value={editing ? editForm.delai_legal_jours : form.delai_legal_jours}
              onChange={(e) => editing ? setEditForm({ ...editForm, delai_legal_jours: e.target.value }) : setForm({ ...form, delai_legal_jours: e.target.value })}
            />
          </div>
          <div className="flex items-end gap-2 md:col-span-3">
            <button type="submit" disabled={updateMutation.isPending || createMutation.isPending} className="btn-primary">
              <Save size={15} /> {editing ? 'Enregistrer' : 'Creer'}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary">
                <X size={15} /> Annuler la modification
              </button>
            )}
          </div>
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl md:col-span-3 border border-amber-100">
              {((createMutation.error || updateMutation.error) as any)?.response?.data?.detail || 'Erreur lors de la sauvegarde'}
            </p>
          )}
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50/80">
              <th className="table-header py-3.5 px-6">Code</th>
              <th className="table-header py-3.5 px-6">Libelle</th>
              <th className="table-header py-3.5 px-6">Delai legal</th>
              <th className="table-header py-3.5 px-6">Statut</th>
              <th className="table-header py-3.5 px-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {isLoading ? (
              <tr><td colSpan={5} className="py-16 text-center text-surface-400 text-sm">Chargement...</td></tr>
            ) : types?.map((t: any) => (
              <tr key={t.id} className="hover:bg-brand-50/30 transition-all duration-200">
                <td className="py-3.5 px-6"><Badge>{t.code}</Badge></td>
                <td className="py-3.5 px-6 font-semibold text-surface-900">{t.libelle}</td>
                <td className="py-3.5 px-6 text-surface-600">{t.delai_legal_jours} jours</td>
                <td className="py-3.5 px-6">
                  <button onClick={() => toggleActif(t)} className="inline-flex items-center gap-1.5">
                    {t.actif
                      ? <><CheckCircle2 size={15} className="text-emerald-500" /><span className="text-xs font-semibold text-emerald-600">Actif</span></>
                      : <><XCircle size={15} className="text-amber-500" /><span className="text-xs font-semibold text-amber-600">Inactif</span></>}
                  </button>
                </td>
                <td className="py-3.5 px-6">
                  <button
                    onClick={() => {
                      setEditing(t)
                      setEditForm({ libelle: t.libelle, delai_legal_jours: String(t.delai_legal_jours) })
                      setShowForm(false)
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800"
                  >
                    <Pencil size={13} /> Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---------------- MOTIFS ---------------- */

function MotifsTab() {
  const queryClient = useQueryClient()
  const [typeId, setTypeId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ code: '', libelle: '', necessite_piece_justificative: false })
  const [editForm, setEditForm] = useState({ code: '', libelle: '', necessite_piece_justificative: false })

  const { data: types } = useQuery({
    queryKey: ['admin-types'],
    queryFn: () => api.get('/api/v1/admin/types-reclamation').then((r) => r.data),
  })

  const { data: motifs, isLoading } = useQuery({
    queryKey: ['admin-motifs', typeId],
    queryFn: () => api.get('/api/v1/admin/motifs-reclamation', { params: typeId ? { id_type: typeId } : {} }).then((r) => r.data),
    enabled: !!typeId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-motifs'] })
    queryClient.invalidateQueries({ queryKey: ['reclamation-motifs'] })
  }

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/admin/motifs-reclamation', data),
    onSuccess: () => { invalidate(); setShowForm(false); setForm({ code: '', libelle: '', necessite_piece_justificative: false }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/api/v1/admin/motifs-reclamation/${id}`, data),
    onSuccess: () => { invalidate(); setEditing(null) },
  })

  const currentType = types?.find((t: any) => String(t.id) === String(typeId))

  return (
    <div className="card p-6" style={{ animation: 'slideUp 0.5s ease-out' }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <FileStack size={18} className="text-white" />
          </div>
          <h2 className="section-title">Motifs de reclamation</h2>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null) }}
          disabled={!typeId}
          className={`btn-primary ${!typeId ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {showForm ? <><X size={15} /> Annuler</> : <><Plus size={15} /> Nouveau motif</>}
        </button>
      </div>

      <div className="mb-6">
        <label className="label">Type de reclamation</label>
        <select className="select max-w-sm" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
          <option value="">Choisir un type...</option>
          {types?.map((t: any) => <option key={t.id} value={t.id}>{t.libelle}{!t.actif ? ' (inactif)' : ''}</option>)}
        </select>
      </div>

      {(showForm || editing) && typeId && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (editing) {
              updateMutation.mutate({ id: editing.id, data: editForm })
            } else {
              createMutation.mutate({ ...form, id_type: parseInt(typeId) })
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-surface-50 border border-surface-100 mb-6"
        >
          <div>
            <label className="label">Code (majuscules)</label>
            <input
              className="input" required
              value={editing ? editForm.code : form.code}
              onChange={(e) => editing ? setEditForm({ ...editForm, code: e.target.value }) : setForm({ ...form, code: e.target.value })}
            />
          </div>
          <div>
            <TextField
              label="Libelle"
              required
              value={editing ? editForm.libelle : form.libelle}
              onChange={(v) => editing ? setEditForm({ ...editForm, libelle: v }) : setForm({ ...form, libelle: v })}
              icon={<FileStack size={16} />}
            />
          </div>
          <div>
            <label className="label">Piece justificative exigee</label>
            <select
              className="select"
              value={editing ? (editForm.necessite_piece_justificative ? '1' : '0') : (form.necessite_piece_justificative ? '1' : '0')}
              onChange={(e) => editing
                ? setEditForm({ ...editForm, necessite_piece_justificative: e.target.value === '1' })
                : setForm({ ...form, necessite_piece_justificative: e.target.value === '1' })}
            >
              <option value="0">Non</option>
              <option value="1">Oui</option>
            </select>
          </div>
          <div className="flex items-end gap-2 md:col-span-3">
            <button type="submit" disabled={updateMutation.isPending || createMutation.isPending} className="btn-primary">
              <Save size={15} /> {editing ? 'Enregistrer' : 'Creer'}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary"><X size={15} /> Annuler</button>
            )}
          </div>
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl md:col-span-3 border border-amber-100">
              {((createMutation.error || updateMutation.error) as any)?.response?.data?.detail || 'Erreur lors de la sauvegarde'}
            </p>
          )}
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50/80">
              <th className="table-header py-3.5 px-6">Code</th>
              <th className="table-header py-3.5 px-6">Libelle</th>
              <th className="table-header py-3.5 px-6">Piece exigee</th>
              <th className="table-header py-3.5 px-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {isLoading ? (
              <tr><td colSpan={4} className="py-16 text-center text-surface-400 text-sm">Chargement...</td></tr>
            ) : !motifs || motifs.length === 0 ? (
              <tr><td colSpan={4} className="py-16 text-center text-surface-400 text-sm">
                {typeId ? `Aucun motif pour « ${currentType?.libelle || ''} »` : 'Selectionnez un type pour voir ses motifs'}
              </td></tr>
            ) : motifs.map((m: any) => (
              <tr key={m.id} className="hover:bg-brand-50/30 transition-all duration-200">
                <td className="py-3.5 px-6"><Badge>{m.code}</Badge></td>
                <td className="py-3.5 px-6 font-semibold text-surface-900">{m.libelle}</td>
                <td className="py-3.5 px-6">
                  {m.necessite_piece_justificative
                    ? <Badge color="bg-amber-50 text-amber-700 border-amber-200/60">Oui</Badge>
                    : <Badge color="bg-surface-100 text-surface-500 border-surface-200">Non</Badge>}
                </td>
                <td className="py-3.5 px-6">
                  <button
                    onClick={() => {
                      setEditing(m)
                      setEditForm({ code: m.code, libelle: m.libelle, necessite_piece_justificative: m.necessite_piece_justificative })
                      setShowForm(false)
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800"
                  >
                    <Pencil size={13} /> Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---------------- SERVICES ---------------- */

function ServicesTab() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ nom: '', code: '', chef_id: '' })
  const [editForm, setEditForm] = useState({ nom: '', code: '', chef_id: '' })

  const { data: services, isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => api.get('/api/v1/admin/services').then((r) => r.data),
  })

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/v1/admin/users').then((r) => r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-services'] })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/admin/services', data),
    onSuccess: () => { invalidate(); setShowForm(false); setForm({ nom: '', code: '', chef_id: '' }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/api/v1/admin/services/${id}`, data),
    onSuccess: () => { invalidate(); setEditing(null) },
  })

  const chefSelect = (value: string, onChange: (v: string) => void) => (
    <div>
      <label className="label">Chef de service</label>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Aucun</option>
        {users?.filter((u: any) => u.actif).map((u: any) => <option key={u.id} value={u.id}>{u.nom} - {u.email}</option>)}
      </select>
    </div>
  )

  const submitData = (data: any) => ({
    ...data,
    chef_id: data.chef_id ? parseInt(data.chef_id) : null,
  })

  return (
    <div className="card p-6" style={{ animation: 'slideUp 0.5s ease-out' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Building2 size={18} className="text-white" />
          </div>
          <h2 className="section-title">Services</h2>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null) }} className="btn-primary">
          {showForm ? <><X size={15} /> Annuler</> : <><Plus size={15} /> Nouveau service</>}
        </button>
      </div>

      {(showForm || editing) && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (editing) {
              updateMutation.mutate({ id: editing.id, data: submitData(editForm) })
            } else {
              createMutation.mutate(submitData(form))
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-surface-50 border border-surface-100 mb-6"
        >
          <div>
            <TextField
              label="Nom du service" required
              value={editing ? editForm.nom : form.nom}
              onChange={(v) => editing ? setEditForm({ ...editForm, nom: v }) : setForm({ ...form, nom: v })}
              icon={<Building2 size={16} />}
            />
          </div>
          <div>
            <label className="label">Code</label>
            <input
              className="input" required maxLength={20}
              value={editing ? editForm.code : form.code}
              onChange={(e) => editing ? setEditForm({ ...editForm, code: e.target.value.toUpperCase() }) : setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </div>
          {editing
            ? chefSelect(editForm.chef_id, (v) => setEditForm({ ...editForm, chef_id: v }))
            : chefSelect(form.chef_id, (v) => setForm({ ...form, chef_id: v }))}
          <div className="flex items-end gap-2 md:col-span-3">
            <button type="submit" disabled={updateMutation.isPending || createMutation.isPending} className="btn-primary">
              <Save size={15} /> {editing ? 'Enregistrer' : 'Creer'}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary"><X size={15} /> Annuler</button>
            )}
          </div>
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl md:col-span-3 border border-amber-100">
              {((createMutation.error || updateMutation.error) as any)?.response?.data?.detail || 'Erreur lors de la sauvegarde'}
            </p>
          )}
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50/80">
              <th className="table-header py-3.5 px-6">Nom</th>
              <th className="table-header py-3.5 px-6">Code</th>
              <th className="table-header py-3.5 px-6">Chef de service</th>
              <th className="table-header py-3.5 px-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {isLoading ? (
              <tr><td colSpan={4} className="py-16 text-center text-surface-400 text-sm">Chargement...</td></tr>
            ) : services?.map((s: any) => (
              <tr key={s.id} className="hover:bg-brand-50/30 transition-all duration-200">
                <td className="py-3.5 px-6 font-semibold text-surface-900">{s.nom}</td>
                <td className="py-3.5 px-6"><Badge>{s.code}</Badge></td>
                <td className="py-3.5 px-6 text-surface-600">
                  {s.chef_nom
                    ? <span className="inline-flex items-center gap-1.5"><UserRound size={14} className="text-brand-500" /> {s.chef_nom}</span>
                    : <span className="text-surface-400">-</span>}
                </td>
                <td className="py-3.5 px-6">
                  <button
                    onClick={() => {
                      setEditing(s)
                      setEditForm({ nom: s.nom, code: s.code, chef_id: s.chef_id ? String(s.chef_id) : '' })
                      setShowForm(false)
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800"
                  >
                    <Pencil size={13} /> Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}