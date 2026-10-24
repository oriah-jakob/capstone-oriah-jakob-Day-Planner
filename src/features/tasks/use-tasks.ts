import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/use-auth'
import {
  createTask,
  deleteTask,
  fetchDayTasks,
  fetchTask,
  fetchTaskTypes,
  setTaskStatus,
  updateTask,
} from '@/features/tasks/api'
import { withStatus } from '@/features/tasks/cache'
import { sortChronologically } from '@/features/tasks/timeline'
import type { CompletionStatus, TaskValues } from '@/lib/validation/task'

export const taskKeys = {
  types: ['task-types'] as const,
  owner: (userId: string) => ['tasks', userId] as const,
  day: (userId: string, date: string) => ['tasks', userId, 'day', date] as const,
  detail: (userId: string, id: string) => ['tasks', userId, 'detail', id] as const,
}

function useUserId() {
  return useAuth().user?.id ?? ''
}

export function useTaskTypes() {
  return useQuery({ queryKey: taskKeys.types, queryFn: fetchTaskTypes, staleTime: Infinity })
}

export function useDayTasks(date: string) {
  const userId = useUserId()

  return useQuery({
    queryKey: taskKeys.day(userId, date),
    queryFn: async () => sortChronologically(await fetchDayTasks(userId, date)),
    enabled: userId !== '',
  })
}

export function useTask(id: string) {
  const userId = useUserId()

  return useQuery({
    queryKey: taskKeys.detail(userId, id),
    queryFn: () => fetchTask(id),
    enabled: userId !== '',
  })
}

function useInvalidateTasks() {
  const userId = useUserId()
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: taskKeys.owner(userId) })
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: (values: TaskValues) => createTask(values),
    onSuccess: invalidate,
  })
}

export function useUpdateTask(id: string) {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: (values: TaskValues) => updateTask(id, values),
    onSuccess: invalidate,
  })
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({ mutationFn: (id: string) => deleteTask(id), onSuccess: invalidate })
}

type StatusChange = { id: string; status: CompletionStatus }

/** FR-15 with an optimistic update that rolls back if the save fails (NFR-12). */
export function useSetTaskStatus() {
  const userId = useUserId()
  const queryClient = useQueryClient()
  const tasksKey = taskKeys.owner(userId)

  return useMutation({
    mutationFn: ({ id, status }: StatusChange) => setTaskStatus(id, status),
    onMutate: async ({ id, status }: StatusChange) => {
      await queryClient.cancelQueries({ queryKey: tasksKey })
      const snapshot = queryClient.getQueriesData({ queryKey: tasksKey })
      queryClient.setQueriesData({ queryKey: tasksKey }, (data: unknown) =>
        withStatus(data, id, status),
      )
      return { snapshot }
    },
    onError: (_error, _change, context) => {
      for (const [key, data] of context?.snapshot ?? []) queryClient.setQueryData(key, data)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  })
}
