import { Link, useNavigate, useSearchParams } from 'react-router'

import { FormAlert } from '@/components/form-alert'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { TaskType } from '@/features/tasks/api'
import { TaskForm } from '@/features/tasks/components/task-form'
import { useCreateTask, useTaskTypes } from '@/features/tasks/use-tasks'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { isIsoDate, todayIsoDate } from '@/lib/datetime'
import type { TaskInput } from '@/lib/validation/task'

const DEFAULT_TYPE_NAME = 'Personal'

function newTask(taskTypes: TaskType[], date: string): TaskInput {
  const type = taskTypes.find((t) => t.type_name === DEFAULT_TYPE_NAME) ?? taskTypes[0]
  return {
    title: '',
    note: '',
    taskDate: date,
    startTime: '',
    endTime: '',
    taskTypeId: type?.id ?? Number.NaN,
    completionStatus: 'not_completed',
  }
}

export default function CreateTaskPage() {
  useDocumentTitle('Create task')

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requested = searchParams.get('date')
  const initialDate = requested && isIsoDate(requested) ? requested : todayIsoDate()

  const taskTypes = useTaskTypes()
  const createTask = useCreateTask()

  return (
    <>
      <PageHeader
        title="Create a new task"
        description="Add a task to your timeline with its date, time, and type."
        actions={
          <Button variant="outline" asChild>
            <Link to="/tasks">Back to My Tasks</Link>
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Task details</CardTitle>
          <CardDescription>Everything except the note is required.</CardDescription>
        </CardHeader>
        <CardContent>
          {taskTypes.isPending && (
            <output aria-live="polite" className="text-sm text-muted-foreground">
              Loading the form…
            </output>
          )}
          {taskTypes.isError && <FormAlert>We could not load the task types.</FormAlert>}
          {taskTypes.data && (
            <TaskForm
              taskTypes={taskTypes.data}
              defaultValues={newTask(taskTypes.data, initialDate)}
              submitLabel="Create Task"
              pendingLabel="Creating…"
              cancelTo={`/?date=${initialDate}`}
              onSubmit={async (values) => {
                const task = await createTask.mutateAsync(values)
                await navigate(`/?date=${task.task_date}`)
              }}
            />
          )}
        </CardContent>
      </Card>
    </>
  )
}
