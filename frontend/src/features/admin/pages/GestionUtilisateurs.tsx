import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/features/auth/api'
import { UserPlus } from 'lucide-react'

export default function GestionUtilisateurs() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    email: '',
    nom: '',
    password: '',
    id_role: '',
    telephone: '',
  })

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/api/v1/admin/users').then((r) => r.data),
  })

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/api/v1/admin/roles').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/admin/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowForm(false)
      setForm({ email: '', nom: '', password: '', id_role: '', telephone: '' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...form,
      id_role: parseInt(form.id_role),
      actif: true,
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          <UserPlus size={16} />
          Nouvel utilisateur
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Creer un utilisateur</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
              <input
                type="text"
                required
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                required
                value={form.id_role}
                onChange={(e) => setForm({ ...form, id_role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              >
                <option value="">Choisir un role...</option>
                {roles?.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.libelle}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
              >
                {createMutation.isPending ? 'Creation...' : 'Creer'}
              </button>
            </div>
          </form>
          {createMutation.isError && (
            <p className="text-xs text-red-600 mt-3">
              {(createMutation.error as any)?.response?.data?.detail || 'Erreur lors de la creation'}
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Nom</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Telephone</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Statut</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">Chargement...</td></tr>
            ) : users?.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">Aucun utilisateur</td></tr>
            ) : (
              users?.map((u: any) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{u.nom}</td>
                  <td className="py-3 px-4">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {typeof u.role?.libelle === 'string' ? u.role.libelle : u.role?.libelle?.value || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4">{u.telephone || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {u.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
