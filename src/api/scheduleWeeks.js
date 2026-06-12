import { getSupabaseClient } from './client'

export async function getScheduleWeeks() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('schedule_weeks')
    .select('*')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
  if (error) throw error
  return data
}

export async function createScheduleWeek(weekStart, notes = null) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('schedule_weeks')
    .insert({ week_start: weekStart, notes, user_id: user.id })
    .select()
  if (error) throw error
  return data[0]
}

export async function updateScheduleWeek(id, updates) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('schedule_weeks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
  if (error) throw error
  return data[0]
}

export async function deleteScheduleWeek(id) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('schedule_weeks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}
