import type { Task } from '@/features/tasks/api'
import { TaskItem } from '@/features/tasks/components/task-item'

type DayTimelineProps = {
  tasks: Task[]
  labelledBy: string
  editable?: boolean
}

/** FR-12: one day's tasks, already sorted by start time. */
export function DayTimeline({ tasks, labelledBy, editable = false }: DayTimelineProps) {
  return (
    <ol aria-labelledby={labelledBy} className="grid gap-3">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} editable={editable} />
      ))}
    </ol>
  )
}
