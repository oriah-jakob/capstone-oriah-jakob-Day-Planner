import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // The timeline is read far more often than it changes, and NFR-13 caps
        // the load at 1.5s. Serving a cached page while revalidating keeps
        // day-to-day navigation off the network.
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}

export function Providers({ children }: { children: ReactNode }) {
  // Created in state so React 19 strict mode double-invocation does not
  // discard the cache on every render.
  const [queryClient] = useState(createQueryClient)

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
