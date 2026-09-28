import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'

import { FormAlert } from '@/components/form-alert'
import { SelectField } from '@/components/select-field'
import { TextField } from '@/components/text-field'
import { TextareaField } from '@/components/textarea-field'
import { Button } from '@/components/ui/button'
import type { TaskType } from '@/features/tasks/api'
import { useCreateTask } from '@/features/tasks/use-tasks'
import { toUserMessage } from '@/lib/errors'
import {
  TASK_NOTE_MAX_LENGTH,
  taskSchema,
  type TaskInput,
  type TaskValues,
} from '@/lib/validation/task'

type CreateTaskFormProps = {
  taskTypes: TaskType[]
  initialDate: string
}

const DEFAULT_TYPE_NAME = 'Personal'

/** FR-11: create a task. Values stay in the form until the insert succeeds (NFR-12). */
export function CreateTaskForm({ taskTypes, initialDate }: CreateTaskFormProps) {
  const navigate = useNavigate()
  const createTask = useCreateTask()
  const [formError, setFormError] = useState<string | null>(null)

  const defaultType = taskTypes.find((type) => type.type_name === DEFAULT_TYPE_NAME) ?? taskTypes[0]

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskInput, unknown, TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      note: '',
      taskDate: initialDate,
      startTime: '',
      endTime: '',
      taskTypeId: defaultType?.id ?? Number.NaN,
      completionStatus: 'not_completed',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const task = await createTask.mutateAsync(values)
      await navigate(`/?date=${task.task_date}`)
    } catch (error) {
      setFormError(toUserMessage(error))
    }
  })

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="grid gap-4">
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

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create Task'}
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/?date=${initialDate}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
