import { getSupabaseClient } from './client'

export async function getScheduleWeeks() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('schedule_weeks')
    .select('*')
    .order('week_start', { ascending: false })
  if (error) throw error
  return data
}

export async function createScheduleWeek(weekStart, notes = null) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
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
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
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
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Não autenticado')
  const { error } = await supabase
    .from('schedule_weeks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}
