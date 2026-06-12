import { getSupabaseClient } from './client'

export async function getSlots() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('slots')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('day_of_week')
    .order('start_time')
  if (error) throw error
  return data
}

export async function createSlot({ location_id, cart_id, group_id, day_of_week, start_time, end_time, capacity }) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
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
  const { data: { user } } = await supabase.auth.getUser()
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
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('slots')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}
