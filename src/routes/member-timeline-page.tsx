import { useId } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router'

import { FormAlert } from '@/components/form-alert'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/features/auth/use-auth'
import { useMemberProfile } from '@/features/family/use-family'
import { DayNavigation } from '@/features/tasks/components/day-navigation'
import { DayTimeline } from '@/features/tasks/components/day-timeline'
import { useDayTasks } from '@/features/tasks/use-tasks'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { formatDayHeading, isIsoDate, todayIsoDate } from '@/lib/datetime'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** FR-19.1: another family member's timeline, view only. */
export default function MemberTimelinePage() {
  const { memberId = '' } = useParams()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const headingId = useId()

  const validId = UUID.test(memberId)
  const member = useMemberProfile(memberId, validId)
  const name = member.data ? `${member.data.first_name} ${member.data.last_name}` : ''
  useDocumentTitle(name ? `${name}'s timeline` : 'Family timeline')

  const today = todayIsoDate()
  const requested = searchParams.get('date')
  const date = requested && isIsoDate(requested) ? requested : today
  const tasks = useDayTasks(date, memberId, Boolean(member.data))

  if (memberId === user?.id) return <Navigate to="/" replace />

  const notShared = !validId || member.data === null

  return (
    <>
      <PageHeader
        title={name ? `${name}'s timeline` : 'Family timeline'}
        description="You can see this timeline because you share a family. Only its owner can change it."
        actions={
          <Button variant="outline" asChild>
            <Link to="/family">Back to Family Access</Link>
          </Button>
        }
      />

      {member.isPending && validId && (
        <output aria-live="polite" className="text-sm text-muted-foreground">
          Loading the timeline…
        </output>
      )}

      {(member.isError || tasks.isError) && <FormAlert>We could not load this timeline.</FormAlert>}

      {notShared && <FormAlert>This timeline is not shared with you.</FormAlert>}

      {member.data && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="leading-none font-semibold">Timeline</h2>
              <Badge variant="secondary">View only</Badge>
            </div>
            <CardDescription aria-live="polite">
              <span id={headingId} className="font-medium text-foreground">
                {formatDayHeading(date)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <DayNavigation
              date={date}
              today={today}
              onChange={(next) =>
                setSearchParams(next === today ? {} : { date: next }, { replace: true })
              }
            />
            {tasks.data?.length === 0 && (
              <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Nothing is shared for this day.
              </p>
            )}
            {tasks.data && tasks.data.length > 0 && (
              <DayTimeline tasks={tasks.data} labelledBy={headingId} />
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
