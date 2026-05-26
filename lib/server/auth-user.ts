import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { ApiError } from '@/lib/server/api-error'

export type AuthenticatedUser = {
  userId: string
  email: string | null
  fullName: string | null
  avatarUrl: string | null
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw new ApiError(error.message, 401)
  }

  if (!user) {
    throw new ApiError('Unauthorized', 401)
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName:
      typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === 'string'
          ? user.user_metadata.name
          : null,
    avatarUrl:
      typeof user.user_metadata?.avatar_url === 'string'
        ? user.user_metadata.avatar_url
        : typeof user.user_metadata?.picture === 'string'
          ? user.user_metadata.picture
          : null,
  }
}
