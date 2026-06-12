import { getSupabaseClient } from './client'

export async function getGroups() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function createGroup(name, responsibleId = null) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('groups')
    .insert([{ name, user_id: user.id, responsible_id: responsibleId ?? null }])
    .select()
  if (error) throw error
  return data[0]
}

export async function updateGroup(id, name, responsibleId = null) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('groups')
    .update({ name, responsible_id: responsibleId ?? null })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
  if (error) throw error
  return data[0]
}

export async function deleteGroup(id) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}
