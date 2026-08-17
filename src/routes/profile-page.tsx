import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { useDocumentTitle } from '@/hooks/use-document-title'

export default function ProfilePage() {
  useDocumentTitle('Profile')

  return (
    <>
      <PageHeader title="User profile" description="Account details and reminder defaults." />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Name, email address, and notification timer.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Profile management arrives in week 4.</p>
        </CardContent>
      </Card>
    </>
  )
}
