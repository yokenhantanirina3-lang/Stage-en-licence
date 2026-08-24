import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/features/auth/api'
import { ArrowLeft } from 'lucide-react'

export default function FormContribuable() {
  const { id } = useParams()
  const navigate = useNavigate()
  const estEdition = !!id

  const [form, setForm] = useState({
    numero_fiscal: '',
    nom_raison_sociale: '',
    type_contribuable: 'MORALE',
    adresse: '',
    email: '',
    telephone: '',
  })

  const { data: existant } = useQuery({
    queryKey: ['contribuable', id],
    queryFn: () => api.get(`/api/v1/contribuables/${id}`).then((r) => r.data),
    enabled: estEdition,
  })

  useEffect(() => {
    if (existant) {
      setForm({
        numero_fiscal: existant.numero_fiscal,
        nom_raison_sociale: existant.nom_raison_sociale,
        type_contribuable: existant.type_contribuable,
        adresse: existant.adresse || '',
        email: existant.email || '',
        telephone: existant.telephone || '',
      })
    }
  }, [existant])

  const mutation = useMutation({
    mutationFn: (data: any) =>
      estEdition
        ? api.patch(`/api/v1/contribuables/${id}`, data)
        : api.post('/api/v1/contribuables/', data),
    onSuccess: () => {
      navigate('/contribuables')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {
      numero_fiscal: form.numero_fiscal,
      nom_raison_sociale: form.nom_raison_sociale,
      type_contribuable: form.type_contribuable,
      adresse: form.adresse || null,
      email: form.email || null,
      telephone: form.telephone || null,
    }
    if (estEdition) {
      delete payload.numero_fiscal
      delete payload.type_contribuable
    }
    mutation.mutate(payload)
  }

  const inputClass =
    'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm'

  return (
    <div>
      <button
        onClick={() => navigate('/contribuables')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {estEdition ? 'Modifier le contribuable' : 'Nouveau contribuable'}
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numero fiscal *</label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={30}
                disabled={estEdition}
                value={form.numero_fiscal}
                onChange={(e) => setForm({ ...form, numero_fiscal: e.target.value })}
                className={`${inputClass} ${estEdition ? 'bg-gray-50 text-gray-400' : ''}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                required
                disabled={estEdition}
                value={form.type_contribuable}
                onChange={(e) => setForm({ ...form, type_contribuable: e.target.value })}
                className={`${inputClass} ${estEdition ? 'bg-gray-50 text-gray-400' : ''}`}
              >
                <option value="PHYSIQUE">Personne physique</option>
                <option value="MORALE">Personne morale</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom / Raison sociale *
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={200}
              value={form.nom_raison_sociale}
              onChange={(e) => setForm({ ...form, nom_raison_sociale: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <textarea
              rows={2}
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              className={inputClass}
            />
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-600">
              {(mutation.error as any)?.response?.data?.detail ||
                (estEdition ? 'Erreur lors de la modification' : 'Numero fiscal deja utilise ou donnees invalides')}
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
          >
            {mutation.isPending
              ? 'Enregistrement...'
              : estEdition
                ? 'Enregistrer les modifications'
                : 'Creer le contribuable'}
          </button>
        </form>
      </div>
    </div>
  )
}
