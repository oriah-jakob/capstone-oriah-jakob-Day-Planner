import { useId, useState, type MouseEvent } from 'react'
import { Link } from 'react-router'

import { FormAlert } from '@/components/form-alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import type { Task } from '@/features/tasks/api'
import { useDeleteTask, useSetTaskStatus } from '@/features/tasks/use-tasks'
import { formatDayHeading } from '@/lib/datetime'

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

/** FR-14: nothing is removed until the user confirms, and the dialog stays open if the delete fails. */
function DeleteTaskButton({ task }: { task: Task }) {
  const deleteTask = useDeleteTask()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onConfirm = async (event: MouseEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await deleteTask.mutateAsync(task.id)
      setOpen(false)
    } catch {
      setError('We could not delete that task. Please try again.')
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        setError(null)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Delete ${task.title}`}>
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this task?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{task.title}&rdquo; will be removed from {formatDayHeading(task.task_date)}. This
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <FormAlert>{error}</FormAlert>}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive' })}
            disabled={deleteTask.isPending}
            onClick={(event) => void onConfirm(event)}
          >
            {deleteTask.isPending ? 'Deleting' : 'Delete task'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function TaskActions({ task }: { task: Task }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <CompletionToggle task={task} />
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/tasks/${task.id}/edit`} aria-label={`Edit ${task.title}`}>
          Edit
        </Link>
      </Button>
      <DeleteTaskButton task={task} />
    </div>
  )
}
