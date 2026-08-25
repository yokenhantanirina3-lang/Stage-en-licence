import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/useAuth'
import api from '@/features/auth/api'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { FileText, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler)

const STATUT_COLORS: Record<string, string> = {
  ENREGISTREE: '#6B7280',
  A_QUALIFIER: '#F97316',
  EN_INSTRUCTION: '#3B82F6',
  EN_ATTENTE_PIECES: '#EAB308',
  PROJET_REPONSE: '#6366F1',
  EN_VALIDATION: '#06B6D4',
  EN_VISA_DIRECTEUR: '#14B8A6',
  SIGNEE: '#84CC16',
  NOTIFIEE: '#A855F7',
  CLOTUREE: '#22C55E',
  REJETEE: '#EF4444',
  CONTENTIEUX_JUDICIAIRE: '#F43F5E',
}

const TYPE_COLORS = ['#2563EB', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6']

export default function Dashboard() {
  const { user } = useAuth()
  const role = user?.role?.libelle
  const showAgent = ['ADMIN', 'CHEF', 'DIRECTEUR'].includes(role || '')

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats-dashboard'],
    queryFn: () => api.get('/api/v1/reclamations/stats').then((r) => r.data),
  })

  const { data: derniers } = useQuery({
    queryKey: ['reclamations-derniers'],
    queryFn: () => api.get('/api/v1/reclamations/', { params: { size: 8 } }).then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const cards = [
    { label: 'Total', value: stats?.total || 0, icon: FileText, color: 'bg-primary-500' },
    { label: 'En cours', value: stats?.en_cours || 0, icon: Clock, color: 'bg-blue-500' },
    { label: 'En retard', value: stats?.en_retard || 0, icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'Delai moyen', value: `${stats?.delai_moyen_jours || 0} j`, icon: CheckCircle, color: 'bg-green-500' },
  ]

  const statutLabels = Object.keys(stats?.par_statut || {})
  const statutValues = Object.values(stats?.par_statut || {})
  const statutData = {
    labels: statutLabels.map((s) => s.replace(/_/g, ' ')),
    datasets: [{
      data: statutValues as number[],
      backgroundColor: statutLabels.map((s) => STATUT_COLORS[s] || '#9CA3AF'),
      borderRadius: 4,
    }],
  }

  const typeLabels = (stats?.par_type || []).map((t: any) => t.libelle)
  const typeValues = (stats?.par_type || []).map((t: any) => t.total)
  const typeData = {
    labels: typeLabels,
    datasets: [{
      data: typeValues as number[],
      backgroundColor: TYPE_COLORS.slice(0, typeLabels.length),
      borderWidth: 2,
    }],
  }

  const moisLabels = (stats?.par_mois || []).map((m: any) => {
    const [y, mo] = m.mois.split('-')
    return `${mo}/${y.slice(2)}`
  })
  const moisValues = (stats?.par_mois || []).map((m: any) => m.total)
  const moisData = {
    labels: moisLabels,
    datasets: [{
      data: moisValues as number[],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
    }],
  }

  const STATUT_FR: Record<string, string> = {
    ENREGISTREE: 'Enregistree',
    A_QUALIFIER: 'A qualifier',
    EN_INSTRUCTION: 'En instruction',
    EN_ATTENTE_PIECES: 'En attente pieces',
    PROJET_REPONSE: 'Projet reponse',
    EN_VALIDATION: 'En validation',
    EN_VISA_DIRECTEUR: 'Visa directeur',
    SIGNEE: 'Signee',
    NOTIFIEE: 'Notifiee',
    CLOTUREE: 'Cloturee',
    REJETEE: 'Rejetee',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Par statut</h2>
          <div className="h-64">
            <Bar
              data={statutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { font: { size: 10 }, maxRotation: 45 } }, y: { beginAtZero: true, ticks: { stepSize: 1 } } },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Par type</h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={typeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } } },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Evolution mensuelle</h2>
          <div className="h-64">
            <Line
              data={moisData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
              }}
            />
          </div>
        </div>
      </div>

      {showAgent && (stats?.par_agent || []).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">Activite par agent</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.par_agent.map((a: any) => (
              <div key={a.nom} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-lg font-bold text-primary-700">{a.traitees}</p>
                <p className="text-sm text-gray-600 truncate">{a.nom}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-4">Dernieres reclamations</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">N Dossier</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date depot</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Statut</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Montant</th>
              </tr>
            </thead>
            <tbody>
              {derniers?.items?.map((r: any) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{r.numero_dossier}</td>
                  <td className="py-3 px-4">{new Date(r.date_depot).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      r.statut === 'CLOTUREE' ? 'bg-green-100 text-green-800' :
                      r.statut === 'EN_INSTRUCTION' ? 'bg-blue-100 text-blue-800' :
                      r.statut === 'EN_ATTENTE_PIECES' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {STATUT_FR[r.statut] || r.statut}
                    </span>
                  </td>
                  <td className="py-3 px-4">{r.montant_concerne ? `${Number(r.montant_concerne).toLocaleString()} DA` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
