import { getSupabaseClient } from './client'

export async function getLocations() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function createLocation(name) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('locations')
    .insert([{ name, user_id: user.id }])
    .select()
  if (error) throw error
  return data[0]
}

export async function updateLocation(id, name) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('locations')
    .update({ name })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
  if (error) throw error
  return data[0]
}

export async function deleteLocation(id) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}
