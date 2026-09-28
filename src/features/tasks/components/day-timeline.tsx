import { Badge } from '@/components/ui/badge'
import type { Task } from '@/features/tasks/api'
import { formatTime } from '@/lib/datetime'
import { cn } from '@/lib/utils'

type DayTimelineProps = {
  tasks: Task[]
  labelledBy: string
}

/** FR-12: one day's tasks, already sorted by start time. */
export function DayTimeline({ tasks, labelledBy }: DayTimelineProps) {
  return (
    <ol aria-labelledby={labelledBy} className="grid gap-3">
      {tasks.map((task) => {
        const completed = task.completion_status === 'completed'

        return (
          <li
            key={task.id}
            className="flex flex-wrap items-start gap-x-4 gap-y-2 rounded-lg border border-border bg-background px-4 py-3"
          >
            <p className="w-24 shrink-0 text-sm">
              <time dateTime={task.start_time.slice(0, 5)} className="block font-semibold">
                {formatTime(task.start_time)}
              </time>
              <span className="sr-only">to</span>
              <time dateTime={task.end_time.slice(0, 5)} className="block text-muted-foreground">
                {formatTime(task.end_time)}
              </time>
            </p>

            <div className="min-w-0 flex-1 basis-48">
              <h3 className="font-medium break-words">{task.title}</h3>
              {task.note && (
                <p className="mt-0.5 text-sm break-words whitespace-pre-line text-muted-foreground">
                  {task.note}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{task.task_types.type_name}</Badge>
              <Badge
                variant="secondary"
                className={cn(completed && 'bg-success text-success-foreground')}
              >
                {completed ? 'Completed' : 'Not completed'}
              </Badge>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
