import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { getPublicEnv } from '@/lib/env/public'
import { ApiError } from '@/lib/server/api-error'

let adminClient: any = null

export function getSupabaseAdminClient() {
  if (adminClient) {
    return adminClient
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new ApiError(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Add it to your local environment and Vercel project settings.',
      500,
    )
  }

  adminClient = createClient(getPublicEnv('NEXT_PUBLIC_SUPABASE_URL'), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}
