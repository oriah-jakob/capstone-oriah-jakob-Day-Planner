import { createClient } from '@supabase/supabase-js'

import { getAccessToken } from '@/lib/auth/session'

/**
 * Browser Supabase client, used for data only.
 *
 * IMPORTANT: do not call `supabase.auth.*` on this client. Supplying the
 * `accessToken` option puts the client in third-party-auth mode, where the
 * built-in auth methods are unsupported. Authentication goes through the
 * /api/auth endpoints so the refresh token can stay in an HttpOnly cookie
 * (NFR-3); this client only carries the in-memory access token so that row
 * level security sees the right user.
 */
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    // Called before every request, so an expired token is refreshed
    // transparently rather than surfacing as a failed query.
    accessToken: getAccessToken,
  },
)
