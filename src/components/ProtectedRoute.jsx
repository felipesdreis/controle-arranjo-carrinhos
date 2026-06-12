import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

/**
 * Guard de rota (US-08).
 *
 * Enquanto o estado de autenticação não foi resolvido (authReady = false),
 * exibe um spinner para evitar flash de redirect antes do getSession terminar.
 *
 * Quando resolvido:
 *   - Sem usuário → redireciona para /auth
 *   - Com usuário → renderiza o conteúdo protegido
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function ProtectedRoute({ children }) {
  const { authReady, user } = useAuthStore()

  if (!authReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto mb-4" />
          <p className="text-slate-600 text-sm">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return children
}
