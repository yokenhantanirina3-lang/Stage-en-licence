import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/features/auth/api'
import { ArrowLeft, Send, FileText, Plus, User, Mail, MessageSquare, DollarSign, Hash } from 'lucide-react'
import TextField from '@/components/TextField'
import PageHero from '@/components/PageHero'
import { filtrerTexte } from '@/lib/validation'

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
    onSuccess: () => navigate('/app/reclamations'),
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
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-2" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <ArrowLeft size={16} />
        Retour
      </button>

      {/* Hero Header */}
      <PageHero
        tile
        icon={<FileText size={26} className="text-white" />}
        title="Nouvelle Reclamation"
        subtitle="Remplissez les informations pour creer une nouvelle reclamation"
      />

      {/* Form */}
      <div className="card p-6" style={{ animation: 'slideUp 0.5s ease-out 0.1s backwards' }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Contribuable */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">Contribuable</label>
              <Link to="/app/contribuables/nouvelle" className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors">
                <Plus size={12} />
                Creer un contribuable
              </Link>
            </div>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <select value={form.id_contribuable} onChange={(e) => setForm({ ...form, id_contribuable: e.target.value })} required className="select pl-9">
                <option value="">Choisir un contribuable...</option>
                {contribuables?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nom_raison_sociale} ({c.numero_fiscal})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Canal */}
          <div>
            <label className="label">Canal d'entree</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <select value={form.canal_entree} onChange={(e) => setForm({ ...form, canal_entree: e.target.value })} className="select pl-9">
                <option value="GUICHET">Guichet</option>
                <option value="COURRIER">Courrier</option>
                <option value="PORTAIL">Portail</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>
          </div>

          {/* Resume */}
          <div>
            <label className="label">Resume des faits</label>
            <div className="relative">
              <MessageSquare size={16} className="absolute left-3 top-3 text-surface-400 pointer-events-none" />
              <textarea
                value={form.resume_faits}
                onChange={(e) => setForm({ ...form, resume_faits: filtrerTexte(e.target.value) })}
                rows={4}
                className="input resize-none pl-9"
                placeholder="Decrivez la reclamation en detail..."
              />
            </div>
          </div>

          {/* Montant + Reference */}
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Montant (MGA)"
              type="nombre"
              value={form.montant_concerne}
              onChange={(v) => setForm({ ...form, montant_concerne: v })}
              placeholder="0.00"
              icon={<DollarSign size={16} />}
            />
            <TextField
              label="Reference imposition"
              value={form.reference_imposition}
              onChange={(v) => setForm({ ...form, reference_imposition: v })}
              placeholder="Ex: REF-2024-001"
              icon={<Hash size={16} />}
            />
          </div>

          {mutation.isError && (
            <div className="text-xs text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
              {(mutation.error as any)?.response?.data?.detail || 'Erreur lors de la creation'}
            </div>
          )}

          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3 text-base">
            {mutation.isPending ? (
              <><div className="spinner" /> Creation...</>
            ) : (
              <><Send size={16} /> Creer la reclamation</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
