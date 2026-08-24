import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/features/auth/api'
import { ArrowLeft } from 'lucide-react'

export default function NouvelleReclamation() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    id_contribuable: '',
    canal_entree: 'GUICHET',
    resume_faits: '',
    montant_concerne: '',
    reference_imposition: '',
  })

  const { data: contribuables } = useQuery({
    queryKey: ['contribuables-select'],
    queryFn: () => api.get('/api/v1/contribuables/?size=100').then((r) => r.data),
  })

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/api/v1/reclamations/', data),
    onSuccess: () => navigate('/reclamations'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      ...form,
      id_contribuable: parseInt(form.id_contribuable),
      montant_concerne: form.montant_concerne ? parseFloat(form.montant_concerne) : null,
    })
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nouvelle Reclamation</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Contribuable</label>
              <Link to="/contribuables/nouvelle" className="text-xs text-primary-600 hover:underline">
                + Creer un contribuable
              </Link>
            </div>
            <select
              value={form.id_contribuable}
              onChange={(e) => setForm({ ...form, id_contribuable: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            >
              <option value="">Choisir un contribuable...</option>
              {contribuables?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.nom_raison_sociale} ({c.numero_fiscal})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Canal d'entree</label>
            <select
              value={form.canal_entree}
              onChange={(e) => setForm({ ...form, canal_entree: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            >
              <option value="GUICHET">Guichet</option>
              <option value="COURRIER">Courrier</option>
              <option value="PORTAIL">Portail</option>
              <option value="EMAIL">Email</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume des faits</label>
            <textarea
              value={form.resume_faits}
              onChange={(e) => setForm({ ...form, resume_faits: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
              placeholder="Decrivez la reclamation..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant (DA)</label>
              <input
                type="number"
                step="0.01"
                value={form.montant_concerne}
                onChange={(e) => setForm({ ...form, montant_concerne: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference imposition</label>
              <input
                type="text"
                value={form.reference_imposition}
                onChange={(e) => setForm({ ...form, reference_imposition: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
          >
            {mutation.isPending ? 'Creation...' : 'Creer la reclamation'}
          </button>
        </form>
      </div>
    </div>
  )
}
