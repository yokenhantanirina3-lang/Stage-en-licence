import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import Login from '@/features/auth/Login'
import MainLayout from '@/app/layout/MainLayout'
import Dashboard from '@/features/dashboard/Dashboard'
import ListeReclamations from '@/features/reclamations/pages/ListeReclamations'
import NouvelleReclamation from '@/features/reclamations/pages/NouvelleReclamation'
import DetailReclamation from '@/features/reclamations/pages/DetailReclamation'
import ListeContribuables from '@/features/contribuables/pages/ListeContribuables'
import FormContribuable from '@/features/contribuables/pages/FormContribuable'
import GestionUtilisateurs from '@/features/admin/pages/GestionUtilisateurs'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="reclamations" element={<ListeReclamations />} />
        <Route path="reclamations/nouvelle" element={<NouvelleReclamation />} />
        <Route path="reclamations/:id" element={<DetailReclamation />} />
        <Route path="contribuables" element={<ListeContribuables />} />
        <Route path="contribuables/nouvelle" element={<FormContribuable />} />
        <Route path="contribuables/:id/modifier" element={<FormContribuable />} />
        <Route path="admin/utilisateurs" element={<GestionUtilisateurs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
