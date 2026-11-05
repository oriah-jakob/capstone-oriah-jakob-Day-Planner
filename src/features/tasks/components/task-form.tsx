import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'

import { FormAlert } from '@/components/form-alert'
import { SelectField } from '@/components/select-field'
import { TextField } from '@/components/text-field'
import { TextareaField } from '@/components/textarea-field'
import { Button } from '@/components/ui/button'
import type { TaskType } from '@/features/tasks/api'
import { toUserMessage } from '@/lib/errors'
import {
  TASK_NOTE_MAX_LENGTH,
  taskSchema,
  type TaskInput,
  type TaskValues,
} from '@/lib/validation/task'

type TaskFormProps = {
  taskTypes: TaskType[]
  defaultValues: TaskInput
  submitLabel: string
  pendingLabel: string
  cancelTo: string
  onSubmit: (values: TaskValues) => Promise<void>
}

/** FR-11 and FR-13. Values stay in the form until the save succeeds (NFR-12). */
export function TaskForm({
  taskTypes,
  defaultValues,
  submitLabel,
  pendingLabel,
  cancelTo,
  onSubmit,
}: TaskFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const hiddenId = useId()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskInput, unknown, TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues,
  })

  const submit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await onSubmit(values)
    } catch (error) {
      setFormError(toUserMessage(error))
    }
  })

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="grid gap-4">
      {formError && <FormAlert>{formError}</FormAlert>}

      <TextField label="Task title" error={errors.title?.message} {...register('title')} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Date"
          type="date"
          error={errors.taskDate?.message}
          {...register('taskDate')}
        />
        <SelectField
          label="Task type"
          error={errors.taskTypeId?.message}
          {...register('taskTypeId', {
            setValueAs: (value: string) => (value === '' ? Number.NaN : Number(value)),
          })}
        >
          {taskTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.type_name}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Start time"
          type="time"
          error={errors.startTime?.message}
          {...register('startTime')}
        />
        <TextField
          label="End time"
          type="time"
          error={errors.endTime?.message}
          {...register('endTime')}
        />
      </div>

      <SelectField
        label="Status"
        error={errors.completionStatus?.message}
        {...register('completionStatus')}
      >
        <option value="not_completed">Not completed</option>
        <option value="completed">Completed</option>
      </SelectField>

      <TextareaField
        label="Notes (optional)"
        hint={`Up to ${TASK_NOTE_MAX_LENGTH} characters.`}
        error={errors.note?.message}
        {...register('note')}
      />

      <div className="flex items-start gap-2">
        <input
          id={hiddenId}
          type="checkbox"
          aria-describedby={`${hiddenId}-hint`}
          className="mt-0.5 size-4 accent-primary"
          {...register('hiddenFromFamily')}
        />
        <div className="grid gap-0.5">
          <label htmlFor={hiddenId} className="text-sm font-medium">
            Hide from family view
          </label>
          <p id={`${hiddenId}-hint`} className="text-xs text-muted-foreground">
            Family members will not see this task on your timeline.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? pendingLabel : submitLabel}
        </Button>
        <Button variant="outline" asChild>
          <Link to={cancelTo}>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
