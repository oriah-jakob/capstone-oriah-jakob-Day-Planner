import { useId, useState } from 'react'

import type { Task } from '@/features/tasks/api'
import { useSetTaskStatus } from '@/features/tasks/use-tasks'

/** FR-15: the box reflects the change at once and snaps back if the save fails. */
function CompletionToggle({ task }: { task: Task }) {
  const setStatus = useSetTaskStatus()
  const id = useId()
  // Holds the clicked value until the save settles so the box never flickers back.
  const [pending, setPending] = useState<boolean | null>(null)
  const checked = pending ?? task.completion_status === 'completed'

  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        aria-label={`Done: ${task.title}`}
        checked={checked}
        disabled={setStatus.isPending}
        onChange={(event) => {
          const next = event.target.checked
          setPending(next)
          setStatus.mutate(
            { id: task.id, status: next ? 'completed' : 'not_completed' },
            { onSettled: () => setPending(null) },
          )
        }}
        className="size-4 accent-primary"
      />
      <label htmlFor={id} className="text-sm">
        Done
      </label>
      {setStatus.isError && (
        <p role="alert" className="text-xs text-destructive">
          We could not save that change.
        </p>
      )}
    </div>
  )
}

export function TaskActions({ task }: { task: Task }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <CompletionToggle task={task} />
    </div>
  )
}
