import { useState, type MouseEvent } from 'react'

import { FormAlert } from '@/components/form-alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { familyErrorMessage } from '@/features/family/members'
import { useRemoveFamilyMember } from '@/features/family/use-family'

type RemoveMemberButtonProps = {
  userId: string
  name: string
}

/** FR-18: only the owner sees this, and the database checks it again. */
export function RemoveMemberButton({ userId, name }: RemoveMemberButtonProps) {
  const removeMember = useRemoveFamilyMember()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onConfirm = async (event: MouseEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await removeMember.mutateAsync(userId)
      setOpen(false)
    } catch (failure) {
      setError(familyErrorMessage(failure))
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        setError(null)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Remove ${name}`}>
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {name} from the family?</AlertDialogTitle>
          <AlertDialogDescription>
            They will no longer see the family&rsquo;s timelines, and nobody in the family will see
            theirs. Their own tasks are not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <FormAlert>{error}</FormAlert>}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive' })}
            disabled={removeMember.isPending}
            onClick={(event) => void onConfirm(event)}
          >
            {removeMember.isPending ? 'Removing' : 'Remove member'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
