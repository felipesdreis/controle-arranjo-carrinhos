import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Verdadeiro quando ambas as variáveis de ambiente estão presentes. */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseUrl.trim() !== '' &&
  supabaseAnonKey && supabaseAnonKey.trim() !== ''
)

/**
 * Retorna o cliente Supabase, inicializando-o na primeira chamada (lazy).
 * Retorna null quando as variáveis de ambiente não estão configuradas,
 * evitando crash na importação do módulo.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient<import('../types/supabase').Database> | null}
 */
let _supabase = null
export function getSupabaseClient() {
  if (_supabase) return _supabase
  if (!isSupabaseConfigured) return null
  _supabase = createClient(supabaseUrl, supabaseAnonKey)
  return _supabase
}

/**
 * Retorna o cliente Supabase e o usuário autenticado, ou lança erro.
 * Usado no início de toda função de API que precisa de sessão.
 *
 * @returns {Promise<{ supabase: import('@supabase/supabase-js').SupabaseClient, user: import('@supabase/supabase-js').User }>}
 */
export async function requireAuthedClient() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  return { supabase, user }
}

/**
 * Valida a presença das variáveis de ambiente Supabase e testa a conectividade.
 * Nunca lança exceção — retorna sempre um objeto { ok, code?, message? }.
 * Falhas de conectividade são tratadas como aviso (schema EP-03 ainda pendente).
 *
 * @returns {Promise<{ ok: boolean, code?: string, message?: string }>}
 */
export async function validateSupabaseConfig() {
  if (!isSupabaseConfigured) {
    const message = 'Variáveis de ambiente Supabase não configuradas'
    console.error('[Supabase] ' + message)
    localStorage.setItem('supabase_config_error', message)
    return { ok: false, code: 'missing_env', message }
  }

  const client = getSupabaseClient()
  if (!client) {
    return { ok: false, code: 'missing_env', message: 'Cliente Supabase não pôde ser inicializado' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const { error } = await client
      .from('brothers')
      .select('count', { count: 'exact', head: true })
      .abortSignal(controller.signal)

    clearTimeout(timeoutId)

    if (error) {
      // Schema EP-03 ainda não existe — falha esperada nesta fase
      const message = error.message
      console.warn('[Supabase] Conectividade parcial (schema pendente):', message)
      return { ok: false, code: 'connectivity', message }
    }

    localStorage.removeItem('supabase_config_error')
    return { ok: true }
  } catch (err) {
    clearTimeout(timeoutId)
    const message = err instanceof Error ? err.message : String(err)
    const code = err?.name === 'AbortError' ? 'timeout' : 'connectivity'
    console.warn('[Supabase] Erro inesperado na validação:', message)
    return { ok: false, code, message }
  }
}
