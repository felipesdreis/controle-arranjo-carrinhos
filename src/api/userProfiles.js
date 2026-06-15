import { getSupabaseClient } from './client'

/**
 * Busca usuários com aprovação pendente (is_approved=false), mais recentes primeiro.
 * Uso exclusivo de administradores.
 *
 * @returns {Promise<Array>}
 */
export async function getPendingUsers() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('is_approved', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/**
 * Busca todos os perfis de usuário, mais recentes primeiro.
 * Uso exclusivo de administradores.
 *
 * @returns {Promise<Array>}
 */
export async function getAllUsers() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/**
 * Aprova ou bloqueia um usuário.
 *
 * @param {string} userId  UUID do user_profiles.user_id
 * @param {boolean} isApproved
 * @returns {Promise<Object>}
 */
export async function updateUserApprovalStatus(userId, isApproved) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ is_approved: isApproved })
    .eq('user_id', userId)
    .select()
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Altera o role de um usuário. Aceita apenas 'admin' ou 'user'.
 *
 * @param {string} userId  UUID do user_profiles.user_id
 * @param {'admin'|'user'} role
 * @returns {Promise<Object>}
 */
export async function updateUserRole(userId, role) {
  if (!['admin', 'user'].includes(role)) {
    throw new Error(`Role inválido: "${role}". Valores aceitos: admin, user`)
  }
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('user_id', userId)
    .select()
  if (error) throw error
  return data?.[0] ?? null
}
