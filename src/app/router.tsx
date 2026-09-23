import { createBrowserRouter } from 'react-router'

import { AppLayout } from '@/components/layout/app-layout'
import { AuthLayout } from '@/components/layout/auth-layout'
import { RouteErrorBoundary } from '@/components/route-error-boundary'
import { RedirectIfAuthenticated } from '@/features/auth/redirect-if-authenticated'
import { RequireAuth } from '@/features/auth/require-auth'
import DashboardPage from '@/routes/dashboard-page'
import FamilyPage from '@/routes/family-page'
import ForgotPasswordPage from '@/routes/forgot-password-page'
import LoginPage from '@/routes/login-page'
import NotFoundPage from '@/routes/not-found-page'
import ProfilePage from '@/routes/profile-page'
import RegisterPage from '@/routes/register-page'
import ResetPasswordPage from '@/routes/reset-password-page'
import SettingsPage from '@/routes/settings-page'
import TasksPage from '@/routes/tasks-page'

export const router = createBrowserRouter([
  {
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        Component: AuthLayout,
        children: [
          {
            Component: RedirectIfAuthenticated,
            children: [
              { path: '/login', Component: LoginPage },
              { path: '/register', Component: RegisterPage },
              { path: '/forgot-password', Component: ForgotPasswordPage },
            ],
          },
          // Not guarded: a signed-in user following a reset link should still
          // be able to set a new password.
          { path: '/reset-password', Component: ResetPasswordPage },
        ],
      },

      {
        path: '/',
        Component: RequireAuth,
        children: [
          {
            Component: AppLayout,
            children: [
              { index: true, Component: DashboardPage },
              { path: 'tasks', Component: TasksPage },
              { path: 'profile', Component: ProfilePage },
              { path: 'family', Component: FamilyPage },
              { path: 'settings', Component: SettingsPage },
              { path: '*', Component: NotFoundPage },
            ],
          },
        ],
      },
    ],
  },
])
