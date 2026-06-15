import { getSupabaseClient } from './client'

export async function getCarts() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('carts')
    .select('*')
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function createCart(name) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
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
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
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
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { error } = await supabase
    .from('carts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}
