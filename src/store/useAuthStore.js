import { create } from 'zustand'
import { getSupabaseClient } from '../api/client'
import {
  signInWithPassword,
  signUp as signUpApi,
  signOut as signOutApi,
  requestPasswordReset as requestPasswordResetApi,
  updatePassword as updatePasswordApi,
} from '../api/auth'

/**
 * Extrai o subconjunto de campos do usuário que o app precisa.
 *
 * @param {import('@supabase/supabase-js').User | null} supabaseUser
 * @returns {{ id: string, email: string } | null}
 */
function extractUser(supabaseUser) {
  if (!supabaseUser) return null
  return { id: supabaseUser.id, email: supabaseUser.email }
}

/**
 * Store de autenticação — separado do useAppStore.
 *
 * Estado:
 *   session     — objeto de sessão Supabase ou null
 *   user        — { id, email } ou null
 *   userProfile — { id, user_id, role, is_approved, created_at, updated_at } ou null
 *   authReady   — false até o getSession inicial resolver (evita flash de redirect)
 *   authError   — mensagem de erro de configuração ou null
 *
 * Contrato com o Agente B (telas de Auth):
 *   signIn(email, password)  → Promise<{ ok: boolean, error?: string }>
 *   signUp(email, password)  → Promise<{ ok: boolean, error?: string }>
 *   signOut()                → Promise<void>
 *   initAuth()               → Promise<() => void>  (retorna unsubscribe)
 */
const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  userProfile: null,
  authReady: false,
  authError: null,

  /**
   * Inicializa a autenticação: restaura sessão existente e registra listener
   * de mudanças. Deve ser chamado uma vez no App.jsx via useEffect.
   *
   * @returns {Promise<() => void>} Função de cleanup para cancelar o listener
   */
  initAuth: async () => {
    const client = getSupabaseClient()

    if (!client) {
      set({
        authReady: true,
        authError: 'Supabase não configurado — autenticação desativada',
      })
      // Retorna função de cleanup vazia para o useEffect não quebrar
      return () => {}
    }

    // Restaura sessão persistida (cookie/localStorage gerenciado pelo Supabase)
    const { data: { session } } = await client.auth.getSession()
    let userProfile = null
    if (session?.user) {
      const { data } = await client
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      userProfile = data ?? null
    }
    set({
      session,
      user: extractUser(session?.user ?? null),
      userProfile,
      authReady: true,
    })

    // Mantém o store sincronizado com eventos de auth (refresh de token, logout em outra aba, etc.)
    const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, newSession) => {
      let newUserProfile = null
      if (newSession?.user) {
        const { data } = await client
          .from('user_profiles')
          .select('*')
          .eq('user_id', newSession.user.id)
          .single()
        newUserProfile = data ?? null
      }
      set({
        session: newSession,
        user: extractUser(newSession?.user ?? null),
        userProfile: newUserProfile,
      })
    })

    return () => subscription.unsubscribe()
  },

  /**
   * Autentica com email e senha.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ ok: boolean, error?: string }>}
   */
  signIn: async (email, password) => {
    const result = await signInWithPassword(email, password)
    // O store é atualizado via onAuthStateChange — não precisa setar session aqui
    return result.ok ? { ok: true } : { ok: false, error: result.error }
  },

  /**
   * Registra novo usuário com email e senha.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ ok: boolean, error?: string }>}
   */
  signUp: async (email, password) => {
    const result = await signUpApi(email, password)
    return result.ok ? { ok: true } : { ok: false, error: result.error }
  },

  /**
   * Logout otimista: limpa o estado local imediatamente, depois notifica
   * o servidor. Erros de rede são ignorados (US-06 cenário 2).
   *
   * @returns {Promise<void>}
   */
  signOut: async () => {
    // Limpa estado antes da chamada de rede — UX imediata sem esperar resposta
    set({ session: null, user: null, userProfile: null })
    await signOutApi()
  },

  /**
   * Envia email com link de recuperação de senha.
   *
   * @param {string} email
   * @returns {Promise<{ ok: boolean, error?: string }>}
   */
  requestPasswordReset: async (email) => {
    const result = await requestPasswordResetApi(email)
    return result.ok ? { ok: true } : { ok: false, error: result.error }
  },

  /**
   * Define uma nova senha para a sessão de recuperação atual.
   *
   * @param {string} newPassword
   * @returns {Promise<{ ok: boolean, error?: string }>}
   */
  updatePassword: async (newPassword) => {
    const result = await updatePasswordApi(newPassword)
    return result.ok ? { ok: true } : { ok: false, error: result.error }
  },
}))

export default useAuthStore
