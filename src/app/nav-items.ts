import { House, ListTodo, Settings, User, Users } from 'lucide-react'
import { type ComponentType } from 'react'

export type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  /** Only match this exact path, not its descendants. */
  end?: boolean
}

export type NavGroup = {
  heading: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: House, end: true },
      { to: '/tasks', label: 'My Tasks', icon: ListTodo },
    ],
  },
  {
    heading: 'Account',
    items: [
      { to: '/profile', label: 'Profile', icon: User },
      { to: '/family', label: 'Family Access', icon: Users },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]
