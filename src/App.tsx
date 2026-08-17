import { RouterProvider } from 'react-router'

import { Providers } from '@/app/providers'
import { router } from '@/app/router'
import { AuthProvider } from '@/features/auth/auth-provider'

export default function App() {
  return (
    <Providers>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </Providers>
  )
}
