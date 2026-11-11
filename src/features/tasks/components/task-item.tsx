import { Badge } from '@/components/ui/badge'
import type { Task } from '@/features/tasks/api'
import { TaskActions } from '@/features/tasks/components/task-actions'
import { formatShortDate, formatTime } from '@/lib/datetime'
import { cn } from '@/lib/utils'

type TaskItemProps = {
  task: Task
  editable?: boolean
  showDate?: boolean
}

export function TaskItem({ task, editable = false, showDate = false }: TaskItemProps) {
  const completed = task.completion_status === 'completed'

  return (
    <li className="flex flex-wrap items-start gap-x-4 gap-y-2 rounded-lg border border-border bg-background px-4 py-3">
      <p className="w-28 shrink-0 text-sm">
        {showDate && (
          <time dateTime={task.task_date} className="block font-medium">
            {formatShortDate(task.task_date)}
          </time>
        )}
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

      <div className="grid justify-items-start gap-2 sm:justify-items-end">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{task.task_types.type_name}</Badge>
          <Badge
            variant="secondary"
            className={cn(completed && 'bg-success text-success-foreground')}
          >
            {completed ? 'Completed' : 'Not completed'}
          </Badge>
        </div>
        {editable && <TaskActions task={task} />}
      </div>
    </li>
  )
}
