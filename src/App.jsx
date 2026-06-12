import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAppStore from './store/useAppStore'
import useAuthStore from './store/useAuthStore'
import { validateSupabaseConfig } from './api/client'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/Auth/AuthPage'
import Dashboard from './pages/Dashboard'
import Brothers from './pages/Brothers'
import Carts from './pages/Carts'
import Locations from './pages/Locations'
import Schedule from './pages/Schedule'
import Report from './pages/Report'
import Settings from './pages/Settings'

function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/brothers" element={<Brothers />} />
            <Route path="/carts" element={<Carts />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/report" element={<Report />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto mb-4" />
        <p className="text-slate-600 text-sm">Iniciando banco de dados...</p>
      </div>
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center bg-white rounded-lg p-8 shadow max-w-md">
        <p className="text-red-600 font-medium mb-2">Erro ao inicializar</p>
        <p className="text-slate-500 text-sm">{message}</p>
      </div>
    </div>
  )
}

export default function App() {
  const { loading, error, initDB } = useAppStore()
  const { user, authReady, initAuth } = useAuthStore()

  useEffect(() => {
    initDB()
  }, [])

  // Validação Supabase não-bloqueante — não interfere no fluxo do initDB/OPFS
  useEffect(() => {
    validateSupabaseConfig()
  }, [])

  // Inicializa autenticação e registra listener; cleanup cancela a subscription
  useEffect(() => {
    let unsubscribe = () => {}
    initAuth().then((fn) => { unsubscribe = fn })
    return () => unsubscribe()
  }, [])

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message={error} />

  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública: aguarda authReady para não exibir o login a um
            usuário já autenticado que recarrega a página (US-08) */}
        <Route
          path="/auth"
          element={
            !authReady ? (
              <LoadingScreen />
            ) : user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthPage />
            )
          }
        />
        {/* Todas as rotas protegidas ficam dentro do ProtectedRoute */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
