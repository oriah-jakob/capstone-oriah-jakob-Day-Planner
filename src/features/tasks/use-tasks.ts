import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/use-auth'
import { createTask, fetchDayTasks, fetchTaskTypes } from '@/features/tasks/api'
import { sortChronologically } from '@/features/tasks/timeline'
import type { TaskValues } from '@/lib/validation/task'

export const taskKeys = {
  types: ['task-types'] as const,
  owner: (userId: string) => ['tasks', userId] as const,
  day: (userId: string, date: string) => ['tasks', userId, 'day', date] as const,
}

export function useTaskTypes() {
  return useQuery({ queryKey: taskKeys.types, queryFn: fetchTaskTypes, staleTime: Infinity })
}

export function useDayTasks(date: string) {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  return useQuery({
    queryKey: taskKeys.day(userId, date),
    queryFn: async () => sortChronologically(await fetchDayTasks(userId, date)),
    enabled: userId !== '',
  })
}

export function useCreateTask() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: TaskValues) => createTask(values),
    onSuccess: async () => {
      if (user) await queryClient.invalidateQueries({ queryKey: taskKeys.owner(user.id) })
    },
  })
}
