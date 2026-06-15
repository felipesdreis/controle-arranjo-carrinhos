import { getSupabaseClient } from './client'

export async function getSlots() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('slots')
    .select('*')
    .eq('active', true)
    .order('day_of_week')
    .order('start_time')
  if (error) throw error
  return data
}

export async function createSlot({ location_id, cart_id, group_id, day_of_week, start_time, end_time, capacity }) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('slots')
    .insert({ location_id, cart_id, group_id, day_of_week, start_time, end_time, capacity, user_id: user.id })
    .select()
  if (error) throw error
  return data[0]
}

export async function updateSlot(id, updates) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('slots')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
  if (error) throw error
  return data[0]
}

export async function deleteSlot(id) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { error } = await supabase
    .from('slots')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}

// Retorna slots com nomes dos locais e carrinhos via foreign key join
export async function getSlotsWithDetails() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('slots')
    .select('*, locations(name), carts(name)')
    .eq('active', true)
    .order('day_of_week')
    .order('start_time')
  if (error) throw error
  // Mapear para incluir location_name e cart_name no nível raiz (compatibilidade com Schedule.jsx)
  return data.map(s => ({
    ...s,
    location_name: s.locations?.name ?? null,
    cart_name: s.carts?.name ?? null,
  }))
}
