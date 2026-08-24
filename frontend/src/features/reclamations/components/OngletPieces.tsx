import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/features/auth/api'
import { Download, Upload } from 'lucide-react'

const CATEGORIES = ['IDENTITE', 'AVIS_IMPOSITION', 'CORRESPONDANCE', 'EXPERTISE', 'AUTRE']

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

  const handleDownload = async (pieceId: number) => {
    const res = await api.get(`/api/v1/reclamations/${reclamationId}/pieces/${pieceId}/download`)
    window.open(res.data.url, '_blank')
  }

  const formatTaille = (octets: number) => {
    if (octets < 1024) return `${octets} o`
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`
    return `${(octets / (1024 * 1024)).toFixed(1)} Mo`
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Pieces jointes</h2>

        <form onSubmit={handleUpload} className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="file"
            onChange={(e) => setFichier(e.target.files?.[0] || null)}
            className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 file:text-sm file:font-medium hover:file:bg-primary-100"
          />
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!fichier || uploadMutation.isPending}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
          >
            <Upload size={14} />
            {uploadMutation.isPending ? 'Depot...' : 'Deposer'}
          </button>
          {uploadMutation.isError && (
            <span className="text-xs text-red-600">
              {(uploadMutation.error as any)?.response?.data?.detail || 'Erreur de depot'}
            </span>
          )}
        </form>

        {isLoading ? (
          <p className="text-sm text-gray-400">Chargement...</p>
        ) : !pieces || pieces.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune piece jointe</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {pieces.map((p: any) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.nom_fichier}</p>
                  <p className="text-xs text-gray-500">
                    {p.categorie} - {formatTaille(p.taille_octets)} -{' '}
                    {new Date(p.date_depot).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => handleDownload(p.id)}
                  className="flex items-center gap-1.5 text-primary-600 hover:text-primary-800 text-sm"
                >
                  <Download size={14} />
                  Telecharger
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
