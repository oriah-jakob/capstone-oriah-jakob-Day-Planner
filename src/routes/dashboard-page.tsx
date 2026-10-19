import { Plus } from 'lucide-react'
import { useId } from 'react'
import { Link, useSearchParams } from 'react-router'

import { FormAlert } from '@/components/form-alert'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/features/auth/use-auth'
import { DayNavigation } from '@/features/tasks/components/day-navigation'
import { DayTimeline } from '@/features/tasks/components/day-timeline'
import { summarizeDay } from '@/features/tasks/timeline'
import { useDayTasks } from '@/features/tasks/use-tasks'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { formatDayHeading, isIsoDate, partOfDay, todayIsoDate } from '@/lib/datetime'

function describeDay(total: number, completed: number): string {
  if (total === 0) return 'No tasks scheduled.'
  const tasks = `${total} ${total === 1 ? 'task' : 'tasks'}`
  return `${tasks} scheduled, ${completed} completed.`
}

export default function DashboardPage() {
  useDocumentTitle('Dashboard')

  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const today = todayIsoDate()
  const requested = searchParams.get('date')
  const date = requested && isIsoDate(requested) ? requested : today
  const dayHeading = formatDayHeading(date)
  const headingId = useId()

  const tasks = useDayTasks(date)
  const summary = summarizeDay(tasks.data ?? [])

  const changeDate = (next: string) => {
    setSearchParams(next === today ? {} : { date: next }, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Good ${partOfDay()}${user ? `, ${user.firstName}` : ''}. Here is your schedule for ${dayHeading}.`}
        actions={
          <Button asChild>
            <Link to={`/tasks/new?date=${date}`}>
              <Plus aria-hidden />
              Add Task
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <h2 className="leading-none font-semibold">Timeline</h2>
          <CardDescription aria-live="polite">
            <span id={headingId} className="font-medium text-foreground">
              {dayHeading}
            </span>
            {tasks.data && <> · {describeDay(summary.total, summary.completed)}</>}
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          <DayNavigation date={date} today={today} onChange={changeDate} />

          {tasks.isPending && (
            <output aria-live="polite" className="text-sm text-muted-foreground">
              Loading your timeline…
            </output>
          )}

          {tasks.isError && (
            <div className="grid max-w-md gap-3">
              <FormAlert>We could not load your timeline.</FormAlert>
              <div>
                <Button variant="outline" onClick={() => void tasks.refetch()}>
                  Try again
                </Button>
              </div>
            </div>
          )}

          {tasks.data?.length === 0 && (
            <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">Nothing is scheduled for this day.</p>
              <Button variant="outline" asChild className="mt-3">
                <Link to={`/tasks/new?date=${date}`}>Add a task</Link>
              </Button>
            </div>
          )}

          {tasks.data && tasks.data.length > 0 && (
            <DayTimeline tasks={tasks.data} labelledBy={headingId} />
          )}
        </CardContent>
      </Card>
    </>
  )
}
