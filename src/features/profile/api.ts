import { supabase } from '@/lib/supabase'
import type { Tables, TablesUpdate } from '@/types/database'

export type Profile = Tables<'profiles'>

export type ProfileUpdate = Pick<
  TablesUpdate<'profiles'>,
  'first_name' | 'last_name' | 'notification_timer_minutes'
>

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, patch: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data
}
