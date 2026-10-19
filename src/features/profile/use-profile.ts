import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/use-auth'
import { fetchProfile, updateProfile, type ProfileUpdate } from '@/features/profile/api'
import { updateSessionUser } from '@/lib/auth/session'

export const profileKeys = {
  detail: (userId: string) => ['profile', userId] as const,
}

export function useProfile() {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  return useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: () => fetchProfile(userId),
    enabled: userId !== '',
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (patch: ProfileUpdate) => {
      if (!user) throw new Error('Not signed in.')
      return updateProfile(user.id, patch)
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.detail(profile.id), profile)
      updateSessionUser({ firstName: profile.first_name, lastName: profile.last_name })
    },
  })
}
