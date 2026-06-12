import { getSupabaseClient } from './client'

/**
 * Mapeia mensagens de erro do Supabase para texto amigável em pt-br.
 * Nunca revela se um email específico existe no sistema (US-05).
 *
 * @param {string} message - Mensagem original do Supabase
 * @returns {string} Mensagem traduzida
 */
function mapErrorMessage(message) {
  if (!message) return 'Erro desconhecido'

  const lower = message.toLowerCase()

  if (lower.includes('invalid login credentials')) {
    return 'Email ou senha incorretos'
  }

  if (lower.includes('user already registered') || lower.includes('already registered')) {
    return 'Este email já está registrado'
  }

  if (lower.includes('invalid email') || lower.includes('unable to validate email')) {
    return 'Email inválido'
  }

  if (lower.includes('password should be at least')) {
    return 'A senha deve ter pelo menos 8 caracteres'
  }

  if (lower.includes('email not confirmed')) {
    return 'Confirme seu email antes de entrar'
  }

  if (lower.includes('too many requests') || lower.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente'
  }

  return message
}

/**
 * Detecta se um signUp retornou usuário com identities vazias,
 * indicando que o email já está registrado (comportamento do Supabase
 * quando "Confirm email" está desativado no projeto).
 *
 * @param {import('@supabase/supabase-js').User | null} user
 * @returns {boolean}
 */
function isEmailAlreadyRegistered(user) {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0)
}

/**
 * Autentica um usuário com email e senha.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ ok: boolean, session?: object, error?: string }>}
 */
export async function signInWithPassword(email, password) {
  const client = getSupabaseClient()
  if (!client) {
    return { ok: false, error: 'Supabase não configurado' }
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password })

  if (error) {
    return { ok: false, error: mapErrorMessage(error.message) }
  }

  return { ok: true, session: data.session }
}

/**
 * Registra um novo usuário com email e senha.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ ok: boolean, session?: object, error?: string }>}
 */
export async function signUp(email, password) {
  const client = getSupabaseClient()
  if (!client) {
    return { ok: false, error: 'Supabase não configurado' }
  }

  const { data, error } = await client.auth.signUp({ email, password })

  if (error) {
    return { ok: false, error: mapErrorMessage(error.message) }
  }

  if (isEmailAlreadyRegistered(data.user)) {
    return { ok: false, error: 'Este email já está registrado' }
  }

  // Sem sessão automática → "Confirm email" está ativo no projeto Supabase.
  // Sinaliza ok=false com instrução clara para o usuário não ficar preso na tela.
  if (!data.session) {
    return {
      ok: false,
      code: 'email_confirmation',
      error: 'Cadastro criado. Verifique seu email para confirmar a conta antes de entrar.',
    }
  }

  return { ok: true, session: data.session }
}

/**
 * Encerra a sessão do usuário no Supabase.
 * Erros de rede são ignorados intencionalmente (logout otimista — US-06).
 *
 * @returns {Promise<void>}
 */
export async function signOut() {
  const client = getSupabaseClient()
  if (!client) return

  try {
    await client.auth.signOut()
  } catch {
    // Ignorado: estado local já foi limpo antes desta chamada (logout otimista)
  }
}
