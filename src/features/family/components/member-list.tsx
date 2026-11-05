import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { FamilyMember } from '@/features/family/api'
import { RemoveMemberButton } from '@/features/family/components/remove-member-button'
import { orderMembers } from '@/features/family/members'
import { initials } from '@/features/profile/format'

type MemberListProps = {
  members: FamilyMember[]
  currentUserId: string
  isOwner: boolean
}

export function MemberList({ members, currentUserId, isOwner }: MemberListProps) {
  return (
    <ul aria-label="Family members" className="grid gap-3">
      {orderMembers(members).map((member) => {
        const { first_name: first, last_name: last, email } = member.profiles
        const owner = member.role === 'owner'

        return (
          <li
            key={member.user_id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-background px-4 py-3"
          >
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            >
              {initials(first, last)}
            </span>
            <div className="min-w-0 flex-1 basis-48">
              <h3 className="font-medium break-words">
                {first} {last}
                {member.user_id === currentUserId && (
                  <span className="text-muted-foreground"> (you)</span>
                )}
              </h3>
              <p className="text-sm break-all text-muted-foreground">{email}</p>
            </div>
            <Badge variant={owner ? 'default' : 'secondary'}>{owner ? 'Owner' : 'Member'}</Badge>
            {member.user_id !== currentUserId && (
              <Button variant="ghost" size="sm" asChild>
                <Link
                  to={`/family/${member.user_id}`}
                  aria-label={`View timeline: ${first} ${last}`}
                >
                  View timeline
                </Link>
              </Button>
            )}
            {isOwner && !owner && (
              <RemoveMemberButton userId={member.user_id} name={`${first} ${last}`} />
            )}
          </li>
        )
      })}
    </ul>
  )
}
