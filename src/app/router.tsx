import { createBrowserRouter } from 'react-router'

import { AppLayout } from '@/components/layout/app-layout'
import DashboardPage from '@/routes/dashboard-page'
import FamilyPage from '@/routes/family-page'
import ProfilePage from '@/routes/profile-page'
import SettingsPage from '@/routes/settings-page'
import TasksPage from '@/routes/tasks-page'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: 'tasks', Component: TasksPage },
      { path: 'profile', Component: ProfilePage },
      { path: 'family', Component: FamilyPage },
      { path: 'settings', Component: SettingsPage },
    ],
  },
])
