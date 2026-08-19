import { FormAlert } from '@/components/form-alert'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChangePasswordForm } from '@/features/auth/components/change-password-form'
import { NotificationTimerForm } from '@/features/profile/components/notification-timer-form'
import { useProfile } from '@/features/profile/use-profile'
import { useDocumentTitle } from '@/hooks/use-document-title'

export default function SettingsPage() {
  useDocumentTitle('Settings')

  const profile = useProfile()

  return (
    <>
      <PageHeader title="Settings" description="Reminder lead time and password." />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              How many minutes before a task starts you get an email reminder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile.isPending && (
              <output aria-live="polite" className="text-sm text-muted-foreground">
                Loading your settings…
              </output>
            )}
            {profile.isError && <FormAlert>We could not load your settings.</FormAlert>}
            {profile.data && <NotificationTimerForm profile={profile.data} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Choose a new password. Any other device you are signed in on will be signed out.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
