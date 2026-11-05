import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/use-auth'
import {
  addFamilyMember,
  createFamily,
  fetchFamily,
  fetchMemberProfile,
  removeFamilyMember,
} from '@/features/family/api'
import { profileKeys } from '@/features/profile/use-profile'

export const familyKeys = {
  detail: (userId: string) => ['family', userId] as const,
  member: (userId: string, memberId: string) => ['family', userId, 'member', memberId] as const,
}

function useUserId() {
  return useAuth().user?.id ?? ''
}

export function useFamily() {
  const userId = useUserId()
  return useQuery({
    queryKey: familyKeys.detail(userId),
    queryFn: fetchFamily,
    enabled: userId !== '',
  })
}

export function useMemberProfile(memberId: string, enabled = true) {
  const userId = useUserId()
  return useQuery({
    queryKey: familyKeys.member(userId, memberId),
    queryFn: () => fetchMemberProfile(memberId),
    enabled: enabled && userId !== '',
  })
}

/** Membership changes the caller's account type too, so the profile is refetched as well. */
function useFamilyMutation<T>(mutationFn: (input: T) => Promise<void>) {
  const userId = useUserId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: familyKeys.detail(userId) }),
        queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) }),
      ])
    },
  })
}

export function useCreateFamily() {
  return useFamilyMutation(createFamily)
}

export function useAddFamilyMember() {
  return useFamilyMutation(addFamilyMember)
}

export function useRemoveFamilyMember() {
  return useFamilyMutation(removeFamilyMember)
}
