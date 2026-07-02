import { requireAuthedClient } from './client'

export async function getCarts() {
  const { supabase } = await requireAuthedClient()
  const { data, error } = await supabase
    .from('carts')
    .select('*')
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function createCart(name) {
  const { supabase, user } = await requireAuthedClient()
  const { data, error } = await supabase
    .from('carts')
    .insert([{ name, user_id: user.id }])
    .select()
  if (error) throw error
  return data[0]
}

export async function updateCart(id, name) {
  const { supabase, user } = await requireAuthedClient()
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
  const { supabase, user } = await requireAuthedClient()
  const { error } = await supabase
    .from('carts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}
