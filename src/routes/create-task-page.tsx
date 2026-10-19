import { Link, useSearchParams } from 'react-router'

import { FormAlert } from '@/components/form-alert'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateTaskForm } from '@/features/tasks/components/create-task-form'
import { useTaskTypes } from '@/features/tasks/use-tasks'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { isIsoDate, todayIsoDate } from '@/lib/datetime'

export default function CreateTaskPage() {
  useDocumentTitle('Create task')

  const [searchParams] = useSearchParams()
  const requested = searchParams.get('date')
  const initialDate = requested && isIsoDate(requested) ? requested : todayIsoDate()

  const taskTypes = useTaskTypes()

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
            <CreateTaskForm taskTypes={taskTypes.data} initialDate={initialDate} />
          )}
        </CardContent>
      </Card>
    </>
  )
}
