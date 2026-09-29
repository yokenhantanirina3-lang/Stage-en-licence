import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/features/auth/api'
import {
  Search, FileText, Calendar, AlertCircle, CheckCircle2, Clock,
  Landmark, ArrowRight, ShieldCheck, Loader2, Timer, UserCheck,
} from 'lucide-react'

const STATUT_FR: Record<string, string> = {
  ENREGISTREE: 'Enregistrée',
  A_QUALIFIER: 'À qualifier',
  EN_INSTRUCTION: 'En instruction',
  EN_ATTENTE_PIECES: 'En attente de pièces',
  PROJET_REPONSE: 'Projet de réponse',
  EN_VALIDATION: 'En validation',
  EN_VISA_DIRECTEUR: 'Visa directeur',
  SIGNEE: 'Signée',
  NOTIFIEE: 'Notifiée',
  CLOTUREE: 'Clôturée',
  REJETEE: 'Rejetée',
  CONTENTIEUX_JUDICIAIRE: 'Contentieux judiciaire',
}

const STATUT_DOT: Record<string, string> = {
  ENREGISTREE: 'bg-slate-400',
  A_QUALIFIER: 'bg-amber-500',
  EN_INSTRUCTION: 'bg-brand-500',
  EN_ATTENTE_PIECES: 'bg-amber-400',
  PROJET_REPONSE: 'bg-brand-400',
  EN_VALIDATION: 'bg-emerald-500',
  EN_VISA_DIRECTEUR: 'bg-brand-500',
  SIGNEE: 'bg-emerald-600',
  NOTIFIEE: 'bg-emerald-500',
  CLOTUREE: 'bg-emerald-500',
  REJETEE: 'bg-amber-600',
  CONTENTIEUX_JUDICIAIRE: 'bg-amber-500',
}

export default function SuiviPublic() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  const rechercher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await api.get('/api/v1/public/reclamations/suivi', {
        params: { code: code.trim() },
      })
      setResult(res.data)
    } catch (err: any) {
      const status = err?.response?.status
      setError(
        status === 404 || !err?.response
          ? 'Dossier introuvable. Veuillez verifier votre code de suivi.'
          : err?.response?.data?.detail || 'Une erreur est survenue. Veuillez reessayer plus tard.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-slate-950 text-surface-800">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-surface-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Landmark size={20} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-surface-900 dark:text-white leading-tight">Portail contribuable</p>
              <p className="text-[11px] text-surface-400">Direction Generale des Impots - Madagascar</p>
            </div>
          </div>
          <Link to="/" className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1">
            Retour a l'accueil <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-8 md:p-12 text-white mb-8">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-brand-400/20 rounded-full blur-2xl" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold tracking-wide mb-4">
              <ShieldCheck size={13} /> Suivi en ligne de votre reclamation
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Suivez l'avancement de votre dossier
            </h1>
            <p className="text-brand-200 mt-3 max-w-lg text-sm md:text-base">
              Saisissez le code de suivi figurant sur votre accuse de reception pour connaitre l'etat
              d'instruction de votre reclamation fiscale.
            </p>

            <form onSubmit={rechercher} className="mt-8 max-w-xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ex : 202609-72A1B3"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-surface-900 placeholder:text-surface-400 outline-none ring-0 focus:ring-4 focus:ring-brand-300/40 text-sm font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-surface-900 text-white text-sm font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Suivre mon dossier
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 flex items-start gap-2 text-sm text-amber-200 bg-white/10 border border-white/20 rounded-2xl p-4">
                <AlertCircle size={17} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </section>

        {result && (
          <section style={{ animation: 'slideUp 0.5s ease-out' }}>
            {/* En-tete du dossier */}
            <div className="card overflow-hidden mb-6">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/20">
                    <FileText size={22} />
                  </div>
                  <div>
                    <p className="font-mono text-lg font-extrabold text-surface-900">{result.numero_dossier}</p>
                    <p className="text-xs text-surface-400 flex items-center gap-1.5 mt-0.5">
                      <Calendar size={12} />
                      Deposee le {new Date(result.date_depot).toLocaleDateString('fr-FR')}
                      {result.reference_imposition && <> · Ref. {result.reference_imposition}</>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold ${result.statut_clos ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-brand-50 text-brand-700 border border-brand-100'}`}>
                    <span className={`w-2 h-2 rounded-full ${STATUT_DOT[result.statut] || 'bg-slate-400'}`} />
                    {STATUT_FR[result.statut] || result.statut}
                  </span>
                </div>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[11px] text-surface-400 uppercase tracking-wide font-semibold">Type</p>
                  <p className="text-sm font-semibold text-surface-800 mt-1">{result.type || 'Non qualifie'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-surface-400 uppercase tracking-wide font-semibold">Motif</p>
                  <p className="text-sm font-semibold text-surface-800 mt-1">{result.motif || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-surface-400 uppercase tracking-wide font-semibold">Canal</p>
                  <p className="text-sm font-semibold text-surface-800 mt-1">{result.canal_entree}</p>
                </div>
                <div>
                  <p className="text-[11px] text-surface-400 uppercase tracking-wide font-semibold">Date limite</p>
                  <p className="text-sm font-semibold text-surface-800 mt-1">
                    {result.date_limite_reponse ? new Date(result.date_limite_reponse).toLocaleDateString('fr-FR') : 'Non definie'}
                  </p>
                </div>
              </div>
              {result.objet && (
                <div className="px-6 pb-6">
                  <p className="text-[11px] text-surface-400 uppercase tracking-wide font-semibold mb-1.5">Objet</p>
                  <p className="text-sm text-surface-700 bg-surface-50 rounded-xl p-3.5 border border-surface-100">{result.objet}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Chronologie */}
              <div className="card p-6 md:col-span-2">
                <h2 className="section-title mb-5 flex items-center gap-2">
                  <Clock size={16} className="text-brand-600" /> Chronologie du dossier
                </h2>
                <div className="relative pl-5 space-y-0">
                  <div className="absolute left-[5px] top-1 bottom-1 w-0.5 bg-gradient-to-b from-brand-300 via-brand-100 to-transparent" />
                  {(result.evenements || []).map((ev: any, i: number) => (
                    <div key={i} className="relative pb-6 last:pb-0">
                      <span className={`absolute -left-5 top-1 w-[11px] h-[11px] rounded-full border-2 border-white dark:border-slate-900 ${i === 0 ? 'bg-brand-500' : 'bg-brand-200'}`} />
                      <p className="text-sm font-semibold text-surface-800">{ev.libelle}</p>
                      <p className="text-xs text-surface-400 mt-0.5">
                        {new Date(ev.date).toLocaleString('fr-FR')}
                        {ev.commentaire && ` · ${ev.commentaire}`}
                      </p>
                    </div>
                  ))}
                  {(result.evenements || []).length === 0 && (
                    <p className="text-sm text-surface-400">Aucun evenement enregistre pour le moment.</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* Pieces */}
                <div className="card p-6">
                  <h2 className="section-title mb-4 flex items-center gap-2">
                    <UserCheck size={16} className="text-brand-600" /> Pieces demandees
                  </h2>
                  {(result.pieces_requises || []).length > 0 ? (
                    <ul className="space-y-2">
                      {(result.pieces_requises || []).map((p: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-surface-700 bg-surface-50 rounded-xl px-3.5 py-2.5 border border-surface-100">
                          <CheckCircle2 size={14} className="text-brand-500 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-surface-400 flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-500" />
                      Aucune piece demandee.
                    </p>
                  )}
                </div>

                {/* Decision */}
                <div className="card p-6">
                  <h2 className="section-title mb-4 flex items-center gap-2">
                    <Timer size={16} className="text-brand-600" /> Decision
                  </h2>
                  {result.decision ? (
                    <div className="space-y-2.5">
                      <p className="text-sm font-semibold text-surface-800">{result.decision.type_decision}</p>
                      <p className="text-xs text-surface-400">
                        Notifiee le {new Date(result.decision.date_decision).toLocaleDateString('fr-FR')}
                      </p>
                      {Number(result.decision.montant_accorde) > 0 && (
                        <div className="flex items-center justify-between text-sm bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-3.5 py-2.5">
                          <span className="font-semibold">Montant accorde</span>
                          <span className="font-bold">{Number(result.decision.montant_accorde).toLocaleString('fr-FR')} Ar</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-surface-400 flex items-center gap-2">
                      {result.statut_clos ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Clock size={15} className="text-amber-500" />}
                      {result.statut_clos ? 'Dossier traite.' : 'Decision en cours de traitement.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-surface-100 dark:border-slate-800 py-6 text-center text-xs text-surface-400">
        Direction Generale des Impots - Madagascar · Portail de suivi des reclamations fiscales
      </footer>
    </div>
  )
}