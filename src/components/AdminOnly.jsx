import { useRoleCheck } from '../hooks/useRoleCheck'

/**
 * Wrapper que renderiza children somente se o usuário autenticado for admin aprovado.
 * Usa null para não renderizar nada — não exibe mensagem de erro.
 */
export default function AdminOnly({ children }) {
  const isAdmin = useRoleCheck('admin')
  return isAdmin ? children : null
}
