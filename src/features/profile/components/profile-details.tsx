import type { Profile } from '@/features/profile/api'
import { accountTypeLabel, formatLeadTime } from '@/features/profile/format'

type DetailProps = {
  term: string
  value: string
  help: string
}

function Detail({ term, value, help }: DetailProps) {
  return (
    <div className="rounded-lg border border-border bg-background px-4 py-3">
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {term}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
      <dd className="mt-1 text-xs text-muted-foreground">{help}</dd>
    </div>
  )
}

/** FR-6.1: name, email address, and notification timer, read-only. */
export function ProfileDetails({ profile }: { profile: Profile }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <Detail
        term="Display name"
        value={`${profile.first_name} ${profile.last_name}`}
        help="Shown on your dashboard and to linked family members."
      />
      <Detail
        term="Email address"
        value={profile.email}
        help="Used to sign in, reset your password, and receive reminders."
      />
      <Detail
        term="Account type"
        value={accountTypeLabel(profile.account_type)}
        help="Family accounts are set up from Family Access."
      />
      <Detail
        term="Default reminder"
        value={formatLeadTime(profile.notification_timer_minutes)}
        help="Change the lead time in Settings."
      />
    </dl>
  )
}
