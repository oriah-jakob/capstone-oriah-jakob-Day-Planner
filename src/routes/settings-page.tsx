import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { useDocumentTitle } from '@/hooks/use-document-title'

export default function SettingsPage() {
  useDocumentTitle('Settings')

  return (
    <>
      <PageHeader title="Settings" description="Reminder lead time and password." />

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            How many minutes before a task starts you get an email reminder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Settings arrive in week 4; email delivery in week 10.
          </p>
        </CardContent>
      </Card>
    </>
  )
}
