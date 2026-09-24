import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/features/auth/api'
import { Scale, FileCheck, Send, CheckCircle, Stamp, PenTool, Inbox, Gavel, ArrowRight, Download } from 'lucide-react'
import TextField from '@/components/TextField'
import { filtrerTexte } from '@/lib/validation'
import { showToast } from '@/components/Toast'

const TYPES_DECISION = ['ADMIS_TOTAL', 'ADMIS_PARTIEL', 'REJETE', 'IRRECEVABLE', 'CADUC']

const FONDEMENTS_JURIDIQUES = [
  'Article 420 ter du Code Général des Impôts',
  'Article 72 du Code Général des Impôts',
  'Article 75 du Code Général des Impôts',
  'Livre des Procédures Fiscales (LPF)',
]

const statutDecisionStyles: Record<string, { bg: string; text: string }> = {
  BROUILLON: { bg: 'bg-surface-100', text: 'text-surface-600' },
  VALIDEE: { bg: 'bg-brand-50', text: 'text-brand-700' },
  SIGNEE: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  NOTIFIEE: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
}

interface Props {
  reclamationId: string
  statutReclamation: string
  role?: string
}

export default function OngletDecision({ reclamationId, statutReclamation, role }: Props) {
  const queryClient = useQueryClient()
  const [avis, setAvis] = useState('FAVORABLE')
  const [fondementChoix, setFondementChoix] = useState(FONDEMENTS_JURIDIQUES[0])
  const [form, setForm] = useState({
    type_decision: 'ADMIS_PARTIEL',
    fondement_juridique: '',
    motivation: '',
    montant_accorde: '0',
    montant_rejete: '0',
  })

  const isAdmin = role === 'ADMIN'
  const isInstructeur = role === 'INSTRUCTEUR' || isAdmin
  const isChef = role === 'CHEF' || isAdmin
  const isDirecteur = role === 'DIRECTEUR' || isAdmin

  const peutRediger = isInstructeur && ['EN_INSTRUCTION', 'EN_ATTENTE_PIECES', 'PROJET_REPONSE'].includes(statutReclamation)

  const { data: decision, isLoading } = useQuery({
    queryKey: ['decision', reclamationId],
    queryFn: () =>
      api.get(`/api/v1/reclamations/${reclamationId}/decision`).then((r) => r.data).catch((err) => (err.response?.status === 404 ? null : Promise.reject(err))),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['decision', reclamationId] })
    queryClient.invalidateQueries({ queryKey: ['reclamation', reclamationId] })
    queryClient.invalidateQueries({ queryKey: ['historique', reclamationId] })
    queryClient.invalidateQueries({ queryKey: ['reclamations'] })
    // files de travail + badges sidebar (le dossier change de file apres l'action)
    queryClient.invalidateQueries({ queryKey: ['reclamations-a-qualifier'] })
    queryClient.invalidateQueries({ queryKey: ['reclamations-a-instruire'] })
    queryClient.invalidateQueries({ queryKey: ['reclamations-a-valider'] })
    queryClient.invalidateQueries({ queryKey: ['sidebar-a-qualifier'] })
    queryClient.invalidateQueries({ queryKey: ['sidebar-a-instruire'] })
    queryClient.invalidateQueries({ queryKey: ['sidebar-a-valider'] })
    queryClient.invalidateQueries({ queryKey: ['sidebar-stats'] })
    queryClient.invalidateQueries({ queryKey: ['stats-dashboard'] })
  }

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(`/api/v1/reclamations/${reclamationId}/decision`, data),
    onSuccess: invalidate,
  })

  const actionMutation = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: any }) => api.post(`/api/v1/decisions/${decision.id}/${path}`, body || {}),
    onSuccess: invalidate,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...form,
      montant_accorde: parseFloat(form.montant_accorde) || 0,
      montant_rejete: parseFloat(form.montant_rejete) || 0,
    })
  }

  const handleDownloadPdf = async () => {
    try {
      const res = await api.get(`/api/v1/decisions/${decision.id}/pdf`, { responseType: 'blob' })
      const blob = res.data
      const contentType = String(res.headers?.['content-type'] || '')
      if (contentType.includes('json') || blob?.type?.includes('application/json')) {
        const text = await blob.text()
        const data = JSON.parse(text)
        if (data.url) { window.open(data.url, '_blank') }
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `decision_${decision.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast('Impossible de telecharger le PDF de decision.', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!decision && !peutRediger) {
    return (
      <div className="card p-6 text-center py-16" style={{ animation: 'slideUp 0.4s ease-out' }}>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-50 flex items-center justify-center mx-auto mb-4">
          <Inbox size={24} className="text-surface-400" />
        </div>
        <p className="font-semibold text-surface-700">Aucune decision pour le moment</p>
      </div>
    )
  }

  if (!decision) {
    return (
      <div className="card p-6" style={{ animation: 'slideUp 0.4s ease-out' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <PenTool size={18} className="text-white" />
          </div>
          <h2 className="section-title">Rediger la decision</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Type de decision</label>
              <div className="relative">
                <Gavel size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <select value={form.type_decision} onChange={(e) => setForm({ ...form, type_decision: e.target.value })} className="select pl-9">
                  {TYPES_DECISION.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <TextField
              label="Montant accorde (MGA)"
              type="nombre"
              value={form.montant_accorde}
              onChange={(v) => setForm({ ...form, montant_accorde: v })}
            />
            <TextField
              label="Montant rejete (MGA)"
              type="nombre"
              value={form.montant_rejete}
              onChange={(v) => setForm({ ...form, montant_rejete: v })}
            />
          </div>
          <div>
            <label className="label">Fondement juridique</label>
            <div className="relative">
              <Scale size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <select
                value={fondementChoix}
                onChange={(e) => {
                  const v = e.target.value
                  setFondementChoix(v)
                  setForm({ ...form, fondement_juridique: v === 'AUTRE' ? '' : v })
                }}
                className="select pl-9"
              >
                {FONDEMENTS_JURIDIQUES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
                <option value="AUTRE">Autre (preciser)...</option>
              </select>
            </div>
            {fondementChoix === 'AUTRE' && (
              <TextField
                label="Precision du fondement juridique"
                required
                value={form.fondement_juridique}
                onChange={(v) => setForm({ ...form, fondement_juridique: v })}
                placeholder="Ex : Art. 72 CIDTA"
              />
            )}
          </div>
          <div>
            <label className="label">Motivation</label>
            <textarea required rows={5} value={form.motivation} onChange={(e) => setForm({ ...form, motivation: filtrerTexte(e.target.value) })} placeholder="Motivation de la decision..." className="input resize-none" />
          </div>
          {createMutation.isError && (
            <p className="text-xs text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
              {(() => {
                const d = (createMutation.error as any)?.response?.data?.detail
                if (Array.isArray(d)) return d.map((e: any) => e.msg).join(' | ')
                return d || 'Erreur'
              })()}
            </p>
          )}
          <button type="submit" disabled={createMutation.isPending} className="btn-primary">
            <FileCheck size={16} />
            {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer le projet'}
          </button>
        </form>
      </div>
    )
  }

  const ds = statutDecisionStyles[decision.statut] || statutDecisionStyles.BROUILLON

  return (
    <div className="space-y-6" style={{ animation: 'slideUp 0.4s ease-out' }}>
      {/* Decision card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Scale size={18} className="text-white" />
            </div>
            <h2 className="section-title">Decision</h2>
          </div>
          <div className="flex items-center gap-3">
            {decision.chemin_pdf && (
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold shadow-md hover:bg-brand-700 transition-colors"
              >
                <Download size={13} />
                PDF decision
              </button>
            )}
            <span className={`badge text-[11px] ${ds.bg} ${ds.text}`}>{decision.statut}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-surface-50/80 rounded-xl p-4 border border-surface-100">
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">Type</p>
            <p className="text-sm font-bold text-surface-900">{decision.type_decision}</p>
          </div>
          <div className="bg-surface-50/80 rounded-xl p-4 border border-surface-100">
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1">Date</p>
            <p className="text-sm font-bold text-surface-900">{new Date(decision.date_decision).toLocaleDateString('fr-FR')}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200/60">
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">Montant accorde</p>
            <p className="text-xl font-extrabold text-emerald-700 tabular-nums">{Number(decision.montant_accorde).toLocaleString('fr-FR')} Ar</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200/60">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">Montant rejete</p>
            <p className="text-xl font-extrabold text-amber-800 tabular-nums">{Number(decision.montant_rejete).toLocaleString('fr-FR')} Ar</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">Fondement juridique</p>
            <p className="text-sm text-surface-900 bg-surface-50/80 p-4 rounded-xl border border-surface-100">{decision.fondement_juridique}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">Motivation</p>
            <p className="text-sm text-surface-900 whitespace-pre-wrap bg-surface-50/80 p-4 rounded-xl border border-surface-100 leading-relaxed">{decision.motivation}</p>
          </div>
        </div>
      </div>

      {actionMutation.isPending && (
        <div className="flex items-center gap-3 text-sm text-brand-600 bg-brand-50 p-4 rounded-xl border border-brand-100" style={{ animation: 'slideUp 0.3s ease-out' }}>
          <div className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
          Traitement en cours...
        </div>
      )}
      {actionMutation.isError && (
        <div className="text-sm text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
          {(actionMutation.error as any)?.response?.data?.detail || 'Erreur lors du traitement'}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {decision.statut === 'BROUILLON' && isInstructeur && (
          <button onClick={() => actionMutation.mutate({ path: 'soumettre', body: {} })} disabled={actionMutation.isPending} className="btn-primary">
            <Send size={15} />
            Soumettre a validation
            <ArrowRight size={14} />
          </button>
        )}
        {decision.statut === 'BROUILLON' && isChef && (
          <div className="flex items-center gap-2 card px-3 py-2">
            <select value={avis} onChange={(e) => setAvis(e.target.value)} className="select border-0 bg-transparent">
              <option value="FAVORABLE">Favorable</option>
              <option value="DEFAVORABLE">Defavorable</option>
            </select>
            <button onClick={() => actionMutation.mutate({ path: 'valider', body: { avis } })} disabled={actionMutation.isPending} className="btn-success">
              <CheckCircle size={15} />
              Valider
            </button>
          </div>
        )}
        {decision.statut === 'VALIDEE' && isDirecteur && (
          <>
            <button onClick={() => actionMutation.mutate({ path: 'visa', body: {} })} disabled={actionMutation.isPending} className="btn-secondary border-emerald-300 text-emerald-700 hover:bg-emerald-50">
              <Stamp size={15} />
              Apposer le visa
            </button>
            <button onClick={() => actionMutation.mutate({ path: 'signer', body: {} })} disabled={actionMutation.isPending} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-200">
              <PenTool size={15} />
              Signer la decision
            </button>
          </>
        )}
        {decision.statut === 'SIGNEE' && (isChef || isDirecteur) && (
          <button onClick={() => actionMutation.mutate({ path: 'notifier' })} disabled={actionMutation.isPending} className="btn-success">
            <CheckCircle size={15} />
            Notifier et cloturer
          </button>
        )}
      </div>
    </div>
  )
}
