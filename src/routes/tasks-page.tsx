import { Plus } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { FormAlert } from '@/components/form-alert'
import { PageHeader } from '@/components/page-header'
import { SelectField } from '@/components/select-field'
import { TextField } from '@/components/text-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskItem } from '@/features/tasks/components/task-item'
import {
  hasFilters,
  NO_FILTERS,
  parseFilters,
  SORT_KEYS,
  toSearchParams,
  type SortKey,
  type TaskFilters,
} from '@/features/tasks/search'
import { sortTasks } from '@/features/tasks/timeline'
import { useTaskSearch, useTaskTypes } from '@/features/tasks/use-tasks'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { isIsoDate } from '@/lib/datetime'
import type { CompletionStatus } from '@/lib/validation/task'

const SORT_LABELS: Record<SortKey, string> = {
  date: 'Date and time',
  title: 'Title',
  type: 'Task type',
  status: 'Status',
}

const SEARCH_DELAY_MS = 300

function describeResults(count: number): string {
  return count === 1 ? '1 task' : `${count} tasks`
}

/** FR-21 to FR-23: search, filter and sort every task on the user's timeline. */
export default function TasksPage() {
  useDocumentTitle('My Tasks')

  const [searchParams, setSearchParams] = useSearchParams()
  // State, not the URL, is the source of truth: URL updates land in a transition, so a
  // handler reading them could act on stale filters and undo the previous change.
  const [filters, setFilters] = useState(() => parseFilters(searchParams))
  const [searchText, setSearchText] = useState(() => searchParams.get('q') ?? '')
  const debounced = useDebouncedValue(filters.query.trim(), SEARCH_DELAY_MS)
  const query = filters.query.trim() === '' ? '' : debounced
  const resultsId = useId()

  const taskTypes = useTaskTypes()
  const results = useTaskSearch({ ...filters, query })
  const tasks = useMemo(
    () => sortTasks(results.data ?? [], filters.sort),
    [results.data, filters.sort],
  )

  const nextSearch = new URLSearchParams(toSearchParams(filters)).toString()
  useEffect(() => {
    if (nextSearch !== searchParams.toString()) setSearchParams(nextSearch, { replace: true })
  }, [nextSearch, searchParams, setSearchParams])

  const update = (patch: Partial<TaskFilters>) => {
    setFilters((current) => ({ ...current, ...patch }))
  }

  const clear = () => {
    setSearchText('')
    setFilters(NO_FILTERS)
  }

  const filtered = hasFilters(filters)

  return (
    <>
      <PageHeader
        title="My Tasks"
        description="Search, sort, and filter all scheduled tasks."
        actions={
          <Button asChild>
            <Link to="/tasks/new">
              <Plus aria-hidden />
              Add Task
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Find tasks</CardTitle>
            <CardDescription>Filters apply as you type.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-4">
              <TextField
                label="Search tasks"
                type="search"
                hint="Matches the title or the note."
                value={searchText}
                onChange={(event) => {
                  setSearchText(event.target.value)
                  update({ query: event.target.value })
                }}
              />
              <SelectField
                label="Sort by"
                value={filters.sort}
                onChange={(event) => update({ sort: event.target.value as SortKey })}
              >
                {SORT_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Task type"
                value={filters.typeId ?? ''}
                onChange={(event) =>
                  update({ typeId: event.target.value === '' ? null : Number(event.target.value) })
                }
              >
                <option value="">All types</option>
                {taskTypes.data?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.type_name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Status"
                value={filters.status ?? ''}
                onChange={(event) =>
                  update({
                    status:
                      event.target.value === '' ? null : (event.target.value as CompletionStatus),
                  })
                }
              >
                <option value="">All statuses</option>
                <option value="not_completed">Not completed</option>
                <option value="completed">Completed</option>
              </SelectField>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <TextField
                label="Date"
                type="date"
                value={filters.date ?? ''}
                onChange={(event) =>
                  update({ date: isIsoDate(event.target.value) ? event.target.value : null })
                }
                className="w-auto"
              />
              <Button variant="outline" onClick={clear} disabled={!filtered && searchText === ''}>
                Clear filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 id={resultsId} className="leading-none font-semibold">
              Matching tasks
            </h2>
            <CardDescription aria-live="polite">
              {results.data && describeResults(tasks.length)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.isPending && (
              <output aria-live="polite" className="text-sm text-muted-foreground">
                Loading your tasks…
              </output>
            )}

            {results.isError && <FormAlert>We could not load your tasks.</FormAlert>}

            {results.data && tasks.length === 0 && (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {filtered ? 'No tasks match these filters.' : 'You have no tasks yet.'}
                </p>
                {filtered ? (
                  <Button variant="outline" className="mt-3" onClick={clear}>
                    Clear filters
                  </Button>
                ) : (
                  <Button variant="outline" asChild className="mt-3">
                    <Link to="/tasks/new">Add a task</Link>
                  </Button>
                )}
              </div>
            )}

            {tasks.length > 0 && (
              <ol aria-labelledby={resultsId} className="grid gap-3">
                {tasks.map((task) => (
                  <TaskItem key={task.id} task={task} editable showDate />
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
