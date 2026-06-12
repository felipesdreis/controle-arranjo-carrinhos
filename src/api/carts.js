import { getSupabaseClient } from './client'

export async function getCarts() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function createCart(name) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('carts')
    .insert([{ name, user_id: user.id }])
    .select()
  if (error) throw error
  return data[0]
}

export async function updateCart(id, name) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('carts')
    .update({ name })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
  if (error) throw error
  return data[0]
}

export async function deleteCart(id) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('carts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}
