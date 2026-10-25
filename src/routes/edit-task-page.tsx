import { Link, useNavigate, useParams } from 'react-router'

import { FormAlert } from '@/components/form-alert'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toTaskInput } from '@/features/tasks/cache'
import { TaskForm } from '@/features/tasks/components/task-form'
import { useTask, useTaskTypes, useUpdateTask } from '@/features/tasks/use-tasks'
import { useDocumentTitle } from '@/hooks/use-document-title'

/** FR-13: edit title, note, date, times, type and status. */
export default function EditTaskPage() {
  useDocumentTitle('Edit task')

  const { taskId = '' } = useParams()
  const navigate = useNavigate()
  const task = useTask(taskId)
  const taskTypes = useTaskTypes()
  const updateTask = useUpdateTask(taskId)

  const loading = task.isPending || taskTypes.isPending
  const failed = task.isError || taskTypes.isError

  return (
    <>
      <PageHeader
        title="Edit task"
        description="Change the details of a task on your timeline."
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
          {loading && (
            <output aria-live="polite" className="text-sm text-muted-foreground">
              Loading the task…
            </output>
          )}
          {failed && <FormAlert>We could not load that task.</FormAlert>}
          {task.data === null && <FormAlert>We could not find that task.</FormAlert>}
          {task.data && taskTypes.data && (
            <TaskForm
              taskTypes={taskTypes.data}
              defaultValues={toTaskInput(task.data)}
              submitLabel="Save changes"
              pendingLabel="Saving…"
              cancelTo={`/?date=${task.data.task_date}`}
              onSubmit={async (values) => {
                const saved = await updateTask.mutateAsync(values)
                await navigate(`/?date=${saved.task_date}`)
              }}
            />
          )}
        </CardContent>
      </Card>
    </>
  )
}
