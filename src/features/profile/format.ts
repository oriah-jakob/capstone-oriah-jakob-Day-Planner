const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  personal: 'Personal account',
  family_owner: 'Family owner',
  family_member: 'Family member',
}

export function accountTypeLabel(accountType: string): string {
  return ACCOUNT_TYPE_LABELS[accountType] ?? 'Personal account'
}

export function formatLeadTime(minutes: number): string {
  if (minutes === 0) return 'At task start'
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} before task start`
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}
