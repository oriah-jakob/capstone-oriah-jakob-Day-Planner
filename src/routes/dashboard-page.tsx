import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { useDocumentTitle } from '@/hooks/use-document-title'

export default function DashboardPage() {
  useDocumentTitle('Dashboard')

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Today's schedule and a quick view of your progress."
      />

      <Card>
        <CardHeader>
          <CardTitle>Today's timeline</CardTitle>
          <CardDescription>Tasks in chronological order by start time.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The timeline is built in week 5. Nothing is scheduled yet.
          </p>
        </CardContent>
      </Card>
    </>
  )
}
