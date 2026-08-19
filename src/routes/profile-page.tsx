import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import { FormAlert } from '@/components/form-alert'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileDetails } from '@/features/profile/components/profile-details'
import { ProfileForm } from '@/features/profile/components/profile-form'
import { accountTypeLabel, initials } from '@/features/profile/format'
import { useProfile } from '@/features/profile/use-profile'
import { useDocumentTitle } from '@/hooks/use-document-title'

/** FR-6 / FR-7: view and edit the profile. */
export default function ProfilePage() {
  useDocumentTitle('Profile')

  const profile = useProfile()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  // Returns focus to the trigger after the form closes (WCAG 2.4.3).
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocus = useRef(false)

  useEffect(() => {
    if (!editing && restoreFocus.current) {
      restoreFocus.current = false
      editButtonRef.current?.focus()
    }
  }, [editing])

  const startEditing = () => {
    setSaved(false)
    setEditing(true)
  }

  const stopEditing = (didSave: boolean) => {
    restoreFocus.current = true
    setSaved(didSave)
    setEditing(false)
  }

  return (
    <>
      <PageHeader
        title="User profile"
        description="Review your account details and reminder defaults."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/tasks">View My Tasks</Link>
            </Button>
            <Button ref={editButtonRef} onClick={startEditing} disabled={editing || !profile.data}>
              Edit Profile
            </Button>
          </>
        }
      />

      {profile.isPending && (
        <output aria-live="polite" className="text-sm text-muted-foreground">
          Loading your profile…
        </output>
      )}

      {profile.isError && (
        <div className="grid max-w-md gap-3">
          <FormAlert>We could not load your profile.</FormAlert>
          <div>
            <Button variant="outline" onClick={() => void profile.refetch()}>
              Try again
            </Button>
          </div>
        </div>
      )}

      {profile.data && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
              >
                {initials(profile.data.first_name, profile.data.last_name)}
              </span>
              <div className="grid gap-1.5">
                <h2 className="text-xl leading-none font-semibold">
                  {profile.data.first_name} {profile.data.last_name}
                </h2>
                <Badge variant="secondary">{accountTypeLabel(profile.data.account_type)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {saved && !editing && <FormAlert variant="success">Profile updated.</FormAlert>}
              {editing ? (
                <ProfileForm
                  profile={profile.data}
                  onCancel={() => stopEditing(false)}
                  onSaved={() => stopEditing(true)}
                />
              ) : (
                <ProfileDetails profile={profile.data} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account overview</CardTitle>
              <CardDescription>Where the rest of your account is managed.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <p>
                <span className="font-medium">Reminders and password</span>
                <br />
                <span className="text-muted-foreground">
                  Set your reminder lead time or change your password in{' '}
                </span>
                <Link to="/settings" className="text-primary underline underline-offset-2">
                  Settings
                </Link>
                .
              </p>
              <p>
                <span className="font-medium">Family sharing</span>
                <br />
                <span className="text-muted-foreground">
                  Linked family members can view your timeline but never change it. Manage links
                  in{' '}
                </span>
                <Link to="/family" className="text-primary underline underline-offset-2">
                  Family Access
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
