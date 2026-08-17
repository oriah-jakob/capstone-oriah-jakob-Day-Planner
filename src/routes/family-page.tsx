import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { useDocumentTitle } from '@/hooks/use-document-title'

export default function FamilyPage() {
  useDocumentTitle('Family Access')

  return (
    <>
      <PageHeader
        title="Family Access"
        description="Manage who can view your schedule in read-only mode."
      />

      <Card>
        <CardHeader>
          <CardTitle>Linked family members</CardTitle>
          <CardDescription>
            Family members can view your timeline but cannot change it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Family accounts and permissions arrive in week 9.
          </p>
        </CardContent>
      </Card>
    </>
  )
}
