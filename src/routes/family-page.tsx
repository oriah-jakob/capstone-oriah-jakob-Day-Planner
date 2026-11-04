import { FormAlert } from '@/components/form-alert'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/features/auth/use-auth'
import { CreateFamilyForm } from '@/features/family/components/create-family-form'
import { MemberList } from '@/features/family/components/member-list'
import { useFamily } from '@/features/family/use-family'
import { useDocumentTitle } from '@/hooks/use-document-title'

/** FR-16 to FR-19. */
export default function FamilyPage() {
  useDocumentTitle('Family Access')

  const { user } = useAuth()
  const family = useFamily()
  const isOwner = family.data?.owner_user_id === user?.id

  return (
    <>
      <PageHeader
        title="Family Access"
        description="Manage who can view your schedule in read-only mode."
      />

      {family.isPending && (
        <output aria-live="polite" className="text-sm text-muted-foreground">
          Loading your family…
        </output>
      )}

      {family.isError && <FormAlert>We could not load your family.</FormAlert>}

      {family.data === null && (
        <Card className="max-w-2xl">
          <CardHeader>
            <h2 className="leading-none font-semibold">Create a family</h2>
            <CardDescription>
              Share your timeline with the people you live with. You become the family owner and can
              add members by the email address they signed up with. Everyone can view each
              other&rsquo;s timelines, but only you can change yours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateFamilyForm />
          </CardContent>
        </Card>
      )}

      {family.data && user && (
        <Card className="max-w-3xl">
          <CardHeader>
            <h2 className="leading-none font-semibold">{family.data.family_name}</h2>
            <CardDescription>
              {isOwner
                ? 'You are the family owner.'
                : 'You are a family member. Only the owner can add or remove people.'}{' '}
              Family members can view each other&rsquo;s timelines but cannot change them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberList members={family.data.family_members} currentUserId={user.id} />
          </CardContent>
        </Card>
      )}
    </>
  )
}
