import useAuthStore from '../store/useAuthStore'

/**
 * Retorna true se o usuário autenticado está aprovado e (opcionalmente) tem o role exigido.
 *
 * @param {'admin'|'user'|undefined} requiredRole  Se omitido, apenas verifica aprovação.
 * @returns {boolean}
 */
export function useRoleCheck(requiredRole) {
  const { user, userProfile } = useAuthStore()
  if (!user || !userProfile) return false
  if (!userProfile.is_approved) return false
  if (requiredRole && userProfile.role !== requiredRole) return false
  return true
}
