import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/features/auth/api'
import { Download, Upload, FileText, Image, File, Inbox, HardDrive } from 'lucide-react'

const CATEGORIES = ['IDENTITE', 'AVIS_IMPOSITION', 'CORRESPONDANCE', 'EXPERTISE', 'AUTRE']

const categorieColors: Record<string, { bg: string; text: string; border: string }> = {
  IDENTITE: { bg: 'bg-brand-50', text: 'text-brand-700', border: 'border-brand-200/60' },
  AVIS_IMPOSITION: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60' },
  CORRESPONDANCE: { bg: 'bg-brand-100', text: 'text-brand-800', border: 'border-brand-200/60' },
  EXPERTISE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60' },
  AUTRE: { bg: 'bg-surface-100', text: 'text-surface-600', border: 'border-surface-200/60' },
}

export default function OngletPieces({ reclamationId }: { reclamationId: string }) {
  const queryClient = useQueryClient()
  const [fichier, setFichier] = useState<File | null>(null)
  const [categorie, setCategorie] = useState('AUTRE')

  const { data: pieces, isLoading } = useQuery({
    queryKey: ['pieces', reclamationId],
    queryFn: () => api.get(`/api/v1/reclamations/${reclamationId}/pieces`).then((r) => r.data),
  })

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post(`/api/v1/reclamations/${reclamationId}/pieces`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pieces', reclamationId] })
      queryClient.invalidateQueries({ queryKey: ['historique', reclamationId] })
      setFichier(null)
    },
  })

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fichier) return
    const formData = new FormData()
    formData.append('fichier', fichier)
    formData.append('categorie', categorie)
    uploadMutation.mutate(formData)
  }

  const handleDownload = async (pieceId: number, nomFichier: string) => {
    const token = localStorage.getItem('access_token')
    const res = await fetch(`/api/v1/reclamations/${reclamationId}/pieces/${pieceId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const data = await res.json()
      if (data.url) window.open(data.url, '_blank')
    } else {
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = nomFichier
      a.click()
    }
  }

  const formatTaille = (octets: number) => {
    if (octets < 1024) return `${octets} o`
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`
    return `${(octets / (1024 * 1024)).toFixed(1)} Mo`
  }

  const getFileIcon = (nom: string) => {
    const ext = nom.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return { icon: Image, color: 'text-brand-500', bg: 'bg-brand-50' }
    if (ext === 'pdf') return { icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' }
    return { icon: File, color: 'text-brand-500', bg: 'bg-brand-50' }
  }

  return (
    <div className="space-y-6" style={{ animation: 'slideUp 0.4s ease-out' }}>
      {/* Upload form */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center"><Upload size={16} className="text-brand-600" /></div>
          <h2 className="section-title">Ajouter une piece</h2>
        </div>
        <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Fichier</label>
            <input
              type="file"
              onChange={(e) => setFichier(e.target.files?.[0] || null)}
              className="input file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:text-sm file:font-medium hover:file:bg-brand-100 file:transition-colors"
            />
          </div>
          <div>
            <label className="label">Categorie</label>
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="select">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" disabled={!fichier || uploadMutation.isPending} className="btn-primary">
            <Upload size={15} />
            {uploadMutation.isPending ? 'Depot...' : 'Deposer'}
          </button>
        </form>
        {uploadMutation.isError && (
          <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl mt-3 border border-amber-100">
            {(uploadMutation.error as any)?.response?.data?.detail || 'Erreur de depot'}
          </p>
        )}
      </div>

      {/* Files list */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center"><HardDrive size={16} className="text-surface-500" /></div>
          <h2 className="section-title">Fichiers ({pieces?.length || 0})</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : !pieces || pieces.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-50 flex items-center justify-center mx-auto mb-4">
              <Inbox size={24} className="text-surface-400" />
            </div>
            <p className="font-semibold text-surface-700">Aucune piece jointe</p>
            <p className="text-sm text-surface-400 mt-1">Deposez un fichier en utilisant le formulaire ci-dessus</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pieces.map((p: any, i: number) => {
              const fi = getFileIcon(p.nom_fichier)
              const cc = categorieColors[p.categorie] || categorieColors.AUTRE
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-surface-100 hover:border-brand-200 hover:bg-brand-50/20 transition-all duration-200 group"
                  style={{ animation: 'slideUp 0.3s ease-out backwards', animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${fi.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <fi.icon size={18} className={fi.color} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-900">{p.nom_fichier}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`badge text-[10px] px-1.5 py-0.5 ${cc.bg} ${cc.text} border ${cc.border}`}>{p.categorie}</span>
                        <span className="text-xs text-surface-400">{formatTaille(p.taille_octets)}</span>
                        <span className="text-xs text-surface-400">{new Date(p.date_depot).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDownload(p.id, p.nom_fichier)} className="btn-ghost text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-xl">
                    <Download size={15} />
                    <span className="hidden sm:inline">Telecharger</span>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
