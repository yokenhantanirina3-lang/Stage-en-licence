import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/features/auth/api'
import {
  UserPlus, Users, Shield, Phone, Mail, Settings, Inbox, Pencil, X, Save, Building2,
} from 'lucide-react'
import TextField from '@/components/TextField'
import PageHero from '@/components/PageHero'

const roleBadgeColors: Record<string, { bg: string; text: string; dot: string }> = {
  ADMIN: { bg: 'bg-brand-50', text: 'text-brand-700', dot: 'bg-brand-500' },
  DIRECTEUR: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  CHEF: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  INSTRUCTEUR: { bg: 'bg-brand-50', text: 'text-brand-700', dot: 'bg-brand-500' },
  SAISIE: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrateur', DIRECTEUR: 'Directeur', CHEF: 'Chef de service', INSTRUCTEUR: 'Instructeur', SAISIE: 'Agent de saisie',
}

const roleGradients: Record<string, string> = {
  ADMIN: 'from-brand-500 to-brand-600',
  DIRECTEUR: 'from-amber-500 to-amber-600',
  CHEF: 'from-emerald-500 to-emerald-600',
  INSTRUCTEUR: 'from-brand-600 to-brand-500',
  SAISIE: 'from-emerald-600 to-emerald-500',
}

export default function GestionUtilisateurs() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ email: '', nom: '', password: '', id_role: '', id_service: '', telephone: '' })
  const [editForm, setEditForm] = useState({ nom: '', telephone: '', id_role: '', id_service: '' })

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/api/v1/admin/users').then((r) => r.data),
  })

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/api/v1/admin/roles').then((r) => r.data),
  })

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/api/v1/admin/services').then((r) => r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/admin/users', data),
    onSuccess: () => {
      invalidate()
      setShowForm(false)
      setForm({ email: '', nom: '', password: '', id_role: '', id_service: '', telephone: '' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/api/v1/admin/users/${id}`, data),
    onSuccess: () => { invalidate(); setEditing(null) },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...form,
      id_role: parseInt(form.id_role),
      id_service: form.id_service ? parseInt(form.id_service) : null,
      actif: true,
    })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    updateMutation.mutate({
      id: editing.id,
      data: {
        nom: editForm.nom,
        telephone: editForm.telephone,
        id_role: parseInt(editForm.id_role),
        id_service: editForm.id_service ? parseInt(editForm.id_service) : 0,
      },
    })
  }

  const toggleActif = (u: any) =>
    updateMutation.mutate({ id: u.id, data: { actif: !u.actif } })

  const getRoleName = (u: any) => {
    if (typeof u.role?.libelle === 'string') return u.role.libelle
    return u.role?.libelle?.value || '-'
  }

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Administration"
        icon={<Settings size={16} className="text-brand-200" />}
        title="Utilisateurs"
        subtitle={`${users?.length || 0} utilisateur${(users?.length || 0) > 1 ? 's' : ''}`}
        actions={
          <button onClick={() => { setShowForm(!showForm); setEditing(null) }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
            <UserPlus size={16} />
            Nouvel utilisateur
          </button>
        }
      />

      {showForm && (
        <div className="card p-6" style={{ animation: 'scaleIn 0.3s ease-out' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <UserPlus size={18} className="text-white" />
            </div>
            <h2 className="section-title">Creer un utilisateur</h2>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input pl-9" />
              </div>
            </div>
            <div>
              <TextField
                label="Nom complet"
                required
                value={form.nom}
                onChange={(v) => setForm({ ...form, nom: v })}
                icon={<Users size={16} />}
              />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Role</label>
              <div className="relative">
                <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <select required value={form.id_role} onChange={(e) => setForm({ ...form, id_role: e.target.value })} className="select pl-9">
                  <option value="">Choisir un role...</option>
                  {roles?.map((r: any) => <option key={r.id} value={r.id}>{r.libelle}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Service</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <select value={form.id_service} onChange={(e) => setForm({ ...form, id_service: e.target.value })} className="select pl-9">
                  <option value="">Aucun service</option>
                  {services?.map((s: any) => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Telephone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="input pl-9" />
              </div>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={createMutation.isPending} className="btn-primary w-full">
                {createMutation.isPending ? 'Creation...' : <><Shield size={15} /> Creer</>}
              </button>
            </div>
          </form>
          {createMutation.isError && (
            <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl mt-4 border border-amber-100">
              {(createMutation.error as any)?.response?.data?.detail || 'Erreur lors de la creation'}
            </p>
          )}
        </div>
      )}

      {editing && (
        <div className="card p-6" style={{ animation: 'scaleIn 0.3s ease-out' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Pencil size={18} className="text-white" />
              </div>
              <h2 className="section-title">Modifier : {editing.nom}</h2>
            </div>
            <button onClick={() => setEditing(null)} className="btn-secondary"><X size={15} /> Fermer</button>
          </div>
          <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <TextField
                label="Nom complet"
                required
                value={editForm.nom}
                onChange={(v) => setEditForm({ ...editForm, nom: v })}
                icon={<Users size={16} />}
              />
            </div>
            <div>
              <label className="label">Telephone</label>
              <input type="tel" value={editForm.telephone} onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Role</label>
              <select required value={editForm.id_role} onChange={(e) => setEditForm({ ...editForm, id_role: e.target.value })} className="select">
                {roles?.map((r: any) => <option key={r.id} value={r.id}>{r.libelle}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Service</label>
              <select value={editForm.id_service} onChange={(e) => setEditForm({ ...editForm, id_service: e.target.value })} className="select">
                <option value="">Aucun service</option>
                {services?.map((s: any) => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={updateMutation.isPending} className="btn-primary w-full">
                {updateMutation.isPending ? 'Enregistrement...' : <><Save size={15} /> Enregistrer</>}
              </button>
            </div>
          </form>
          {updateMutation.isError && (
            <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl mt-4 border border-amber-100">
              {(updateMutation.error as any)?.response?.data?.detail || "Erreur lors de l'enregistrement"}
            </p>
          )}
        </div>
      )}

      <div className="card overflow-hidden" style={{ animation: 'slideUp 0.5s ease-out 0.1s backwards' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/80">
                <th className="table-header py-3.5 px-6">Nom</th>
                <th className="table-header py-3.5 px-6">Email</th>
                <th className="table-header py-3.5 px-6">Role</th>
                <th className="table-header py-3.5 px-6">Service</th>
                <th className="table-header py-3.5 px-6">Telephone</th>
                <th className="table-header py-3.5 px-6">Statut</th>
                <th className="table-header py-3.5 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-10 h-10">
                        <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
                      </div>
                      <span className="text-sm text-surface-400 font-medium">Chargement...</span>
                    </div>
                  </td>
                </tr>
              ) : users?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-50 flex items-center justify-center">
                        <Inbox size={24} className="text-surface-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-surface-700">Aucun utilisateur</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                users?.map((u: any, i: number) => {
                  const roleName = getRoleName(u)
                  const rc = roleBadgeColors[roleName] || roleBadgeColors.ADMIN
                  const rg = roleGradients[roleName] || 'from-brand-500 to-brand-600'
                  return (
                    <tr key={u.id} className={`hover:bg-brand-50/30 transition-all duration-200 ${!u.actif ? 'opacity-50' : ''}`} style={{ animation: 'fadeIn 0.4s ease-out backwards', animationDelay: `${0.3 + i * 0.03}s` }}>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${rg} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                            {u.nom?.charAt(0) || '?'}
                          </div>
                          <span className="font-semibold text-surface-900">{u.nom}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-surface-600">{u.email}</td>
                      <td className="py-3.5 px-6">
                        <span className={`badge text-[11px] border ${rc.bg} ${rc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                          {roleLabels[roleName] || roleName}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-surface-600">{u.service?.nom || '-'}</td>
                      <td className="py-3.5 px-6 text-surface-600">{u.telephone || '-'}</td>
                      <td className="py-3.5 px-6">
                        <button onClick={() => toggleActif(u)} title={u.actif ? 'Desactiver' : 'Activer'}>
                          <span className={`badge text-[11px] ${u.actif ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-amber-50 text-amber-700 border border-amber-200/60'}`}>
                            {u.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </button>
                      </td>
                      <td className="py-3.5 px-6">
                        <button
                          onClick={() => {
                            setEditing(u)
                            setEditForm({
                              nom: u.nom,
                              telephone: u.telephone || '',
                              id_role: String(u.id_role),
                              id_service: u.id_service ? String(u.id_service) : '',
                            })
                            setShowForm(false)
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800"
                        >
                          <Pencil size={13} /> Modifier
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}