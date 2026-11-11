import { supabase } from '@/lib/supabase'

/** RLS returns only the caller's family, so there is at most one row. */
export async function fetchFamily() {
  const { data, error } = await supabase
    .from('families')
    .select(
      'id, family_name, owner_user_id, family_members(user_id, role, joined_at, profiles(first_name, last_name, email))',
    )
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createFamily(familyName: string) {
  const { error } = await supabase.rpc('create_family', { p_family_name: familyName })
  if (error) throw error
}

export async function addFamilyMember(email: string) {
  const { error } = await supabase.rpc('add_family_member', { p_email: email })
  if (error) throw error
}

export async function removeFamilyMember(userId: string) {
  const { error } = await supabase.rpc('remove_family_member', { p_user_id: userId })
  if (error) throw error
}

/** Null unless the person shares the caller's family (or is the caller). */
export async function fetchMemberProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export type Family = NonNullable<Awaited<ReturnType<typeof fetchFamily>>>
export type FamilyMember = Family['family_members'][number]
