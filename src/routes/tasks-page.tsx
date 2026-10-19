import { Plus } from 'lucide-react'
import { Link } from 'react-router'

import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDocumentTitle } from '@/hooks/use-document-title'

export default function TasksPage() {
  useDocumentTitle('My Tasks')

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

      <Card>
        <CardHeader>
          <CardTitle>Task list</CardTitle>
          <CardDescription>Every task on your timeline, across all dates.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Search, sort, and filter under construction.
          </p>
        </CardContent>
      </Card>
    </>
  )
}
