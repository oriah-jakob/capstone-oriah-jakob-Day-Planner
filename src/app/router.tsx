import { createBrowserRouter } from 'react-router'

import { AppLayout } from '@/components/layout/app-layout'
import { RouteErrorBoundary } from '@/components/route-error-boundary'
import DashboardPage from '@/routes/dashboard-page'
import FamilyPage from '@/routes/family-page'
import NotFoundPage from '@/routes/not-found-page'
import ProfilePage from '@/routes/profile-page'
import SettingsPage from '@/routes/settings-page'
import TasksPage from '@/routes/tasks-page'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    // Renders inside the layout, so a failed page keeps the navigation usable.
    ErrorBoundary: RouteErrorBoundary,
    children: [
      { index: true, Component: DashboardPage },
      { path: 'tasks', Component: TasksPage },
      { path: 'profile', Component: ProfilePage },
      { path: 'family', Component: FamilyPage },
      { path: 'settings', Component: SettingsPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
])
