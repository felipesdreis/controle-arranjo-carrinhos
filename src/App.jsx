import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAppStore from './store/useAppStore'
import useAuthStore from './store/useAuthStore'
import { useRoleCheck } from './hooks/useRoleCheck'
import { validateSupabaseConfig } from './api/client'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/Auth/AuthPage'
import UpdatePassword from './pages/Auth/UpdatePassword'
import Dashboard from './pages/Dashboard'
import Brothers from './pages/Brothers'
import Carts from './pages/Carts'
import Locations from './pages/Locations'
import Schedule from './pages/Schedule'
import Report from './pages/Report'
import Settings from './pages/Settings'
import AdminUsersPage from './pages/Admin/Users'

/**
 * Guard de role: redireciona para /report se o usuário aprovado não tiver role suficiente.
 * Usuários com role='user' não podem acessar rotas de edição.
 */
function RoleRoute({ children }) {
  const hasAccess = useRoleCheck('admin')
  if (!hasAccess) return <Navigate to="/report" replace />
  return children
}

/**
 * Guard de role admin: redireciona para /dashboard se o usuário não for admin aprovado.
 */
function AdminRoute({ children }) {
  const isAdmin = useRoleCheck('admin')
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-surface-bg">
          <Routes>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/brothers" element={<RoleRoute><Brothers /></RoleRoute>} />
            <Route path="/carts" element={<RoleRoute><Carts /></RoleRoute>} />
            <Route path="/locations" element={<RoleRoute><Locations /></RoleRoute>} />
            <Route path="/schedule" element={<RoleRoute><Schedule /></RoleRoute>} />
            <Route path="/report" element={<Report />} />
            <Route path="/settings" element={<RoleRoute><Settings /></RoleRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
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
        <p className="text-slate-600 text-sm">Carregando dados...</p>
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
  const { loading, error, initializeData } = useAppStore()
  const { user, userProfile, authReady, initAuth } = useAuthStore()

  useEffect(() => {
    validateSupabaseConfig()
  }, [])

  // Inicializa autenticação e registra listener; cleanup cancela a subscription
  useEffect(() => {
    let unsubscribe = () => {}
    initAuth().then((fn) => { unsubscribe = fn })
    return () => unsubscribe()
  }, [])

  // Carrega dados somente quando o usuário estiver autenticado
  useEffect(() => {
    if (user) {
      initializeData()
    }
  }, [user?.id])

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message={error} />

  // Usuário autenticado mas não aprovado: redireciona para /auth
  // (o authReady garante que o userProfile já foi carregado antes de avaliar)
  if (
    authReady &&
    user &&
    userProfile &&
    !userProfile.is_approved &&
    window.location.pathname !== '/reset-password'
  ) {
    return (
      <BrowserRouter>
        <Routes>
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center bg-white rounded-lg p-8 shadow max-w-md">
                  <p className="text-slate-700 font-medium mb-2">Aguardando aprovação</p>
                  <p className="text-slate-500 text-sm mb-4">
                    Sua conta foi criada e está aguardando aprovação de um administrador.
                    Entre em contato com o responsável pelo sistema.
                  </p>
                  <button
                    onClick={() => useAuthStore.getState().signOut()}
                    className="text-sm text-slate-500 underline hover:text-slate-700"
                  >
                    Sair
                  </button>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    )
  }

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
        {/* Rota pública: definir nova senha via link de recuperação por email.
            Não reaproveita /auth pois o Supabase autentica uma sessão de
            recovery ao clicar no link (user ≠ null) — /auth redirecionaria
            direto pro dashboard nesse caso. */}
        <Route
          path="/reset-password"
          element={!authReady ? <LoadingScreen /> : <UpdatePassword />}
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
