import { getSupabaseClient } from './client'

export async function getCongregationName() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('user_settings')
    .select('congregation_name')
    .eq('user_id', user.id)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null  // row not found = settings não criado ainda
    throw error
  }
  return data?.congregation_name ?? null
}

export async function updateCongregationName(name) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('user_settings')
    .update({ congregation_name: name })
    .eq('user_id', user.id)
    .select()
  if (error) throw error
  return data[0]
}
