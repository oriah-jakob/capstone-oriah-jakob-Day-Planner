import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { useDocumentTitle } from '@/hooks/use-document-title'

export default function TasksPage() {
  useDocumentTitle('My Tasks')

  return (
    <>
      <PageHeader title="My Tasks" description="Search, sort, and filter all scheduled tasks." />

      <Card>
        <CardHeader>
          <CardTitle>Task list</CardTitle>
          <CardDescription>Every task on your timeline, across all dates.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Task creation arrives in week 5; search, filter, and sort in week 8.
          </p>
        </CardContent>
      </Card>
    </>
  )
}
