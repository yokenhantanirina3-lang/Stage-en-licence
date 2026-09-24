import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/features/auth/api'
import { ArrowLeft, Save, UserPlus, Hash, User, Mail, Phone, MapPin, Building2, Sparkles } from 'lucide-react'
import TextField from '@/components/TextField'
import PageHero from '@/components/PageHero'
import { filtrerTexte } from '@/lib/validation'

export default function FormContribuable() {
  const { id } = useParams()
  const navigate = useNavigate()
  const estEdition = !!id

  const numeroAuto = useMemo(() => {
    const annee = new Date().getFullYear()
    const seq = String(Math.floor(100000 + Math.random() * 900000))
    return `NF-${annee}-${seq}`
  }, [])

  const [form, setForm] = useState({
    numero_fiscal: numeroAuto,
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
    onSuccess: () => navigate('/app/contribuables'),
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
    if (estEdition) { delete payload.numero_fiscal; delete payload.type_contribuable }
    mutation.mutate(payload)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => navigate('/app/contribuables')} className="btn-ghost -ml-2" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <ArrowLeft size={16} />
        Retour
      </button>

      {/* Hero Header */}
      <PageHero
        tile
        icon={estEdition ? <Save size={26} className="text-white" /> : <UserPlus size={26} className="text-white" />}
        title={estEdition ? 'Modifier le contribuable' : 'Nouveau contribuable'}
        subtitle={estEdition ? 'Modifiez les informations du contribuable' : 'Remplissez les informations pour creer un contribuable'}
      />

      {/* Form */}
      <div className="card p-6" style={{ animation: 'slideUp 0.5s ease-out 0.1s backwards' }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Numero fiscal (auto)</label>
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" />
                <input type="text" readOnly value={form.numero_fiscal} className="input pl-9 bg-brand-50/40 text-brand-700 font-mono font-semibold cursor-default" />
                <Sparkles size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
              </div>
              <p className="text-xs text-brand-500 mt-1 flex items-center gap-1">
                <Sparkles size={11} /> Genere automatiquement par le systeme
              </p>
            </div>
            <div>
              <label className="label">Type *</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <select required disabled={estEdition} value={form.type_contribuable} onChange={(e) => setForm({ ...form, type_contribuable: e.target.value })} className={`select pl-9 ${estEdition ? 'bg-surface-50 text-surface-400 cursor-not-allowed' : ''}`}>
                  <option value="PHYSIQUE">Personne physique</option>
                  <option value="MORALE">Personne morale</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <TextField
              label="Nom / Raison sociale"
              required
              minLength={2}
              maxLength={200}
              value={form.nom_raison_sociale}
              onChange={(v) => setForm({ ...form, nom_raison_sociale: v })}
              icon={<User size={16} />}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input pl-9" />
              </div>
            </div>
            <div>
              <label className="label">Telephone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="input pl-9" />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Adresse</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-surface-400 pointer-events-none" />
              <textarea rows={2} value={form.adresse} onChange={(e) => setForm({ ...form, adresse: filtrerTexte(e.target.value) })} className="input resize-none pl-9" />
            </div>
          </div>

          {mutation.isError && (
            <div className="text-xs text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
              {(mutation.error as any)?.response?.data?.detail || (estEdition ? 'Erreur lors de la modification' : 'Numero fiscal deja utilise ou donnees invalides')}
            </div>
          )}

          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3 text-base">
            {mutation.isPending ? (
              <><div className="spinner" /> Enregistrement...</>
            ) : (
              <>{estEdition ? <Save size={16} /> : <UserPlus size={16} />} {estEdition ? 'Enregistrer les modifications' : 'Creer le contribuable'}</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
