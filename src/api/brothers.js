import { requireAuthedClient } from './client'

export async function getBrothers() {
  const { supabase } = await requireAuthedClient()
  const { data, error } = await supabase
    .from('brothers')
    .select('*')
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function createBrother({ name, phone, notes }) {
  const { supabase, user } = await requireAuthedClient()
  const { data, error } = await supabase
    .from('brothers')
    .insert([{ name, user_id: user.id, phone: phone ?? null, notes: notes ?? null }])
    .select()
  if (error) throw error
  return data[0]
}

export async function updateBrother(id, { name, phone, notes }) {
  const { supabase, user } = await requireAuthedClient()
  const { data, error } = await supabase
    .from('brothers')
    .update({ name, phone: phone ?? null, notes: notes ?? null })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
  if (error) throw error
  return data[0]
}

export async function deleteBrother(id) {
  const { supabase, user } = await requireAuthedClient()
  const { error } = await supabase
    .from('brothers')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}
