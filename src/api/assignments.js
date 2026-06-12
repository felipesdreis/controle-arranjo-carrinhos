import { getSupabaseClient } from './client'

export async function getAssignments() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('user_id', user.id)
  if (error) throw error
  return data
}

export async function getAssignmentsByWeek(weekId) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_id', weekId)
  if (error) throw error
  return data
}

export async function upsertAssignment(weekId, slotId, position, brotherId) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('assignments')
    .upsert(
      [{ week_id: weekId, slot_id: slotId, position, brother_id: brotherId, user_id: user.id }],
      { onConflict: 'week_id,slot_id,position' }
    )
    .select()
  if (error) throw error
  return data[0]
}

export async function deleteAssignment(weekId, slotId, position) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('week_id', weekId)
    .eq('slot_id', slotId)
    .eq('position', position)
    .eq('user_id', user.id)
  if (error) throw error
}
