import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getDisplayName(user: {
  email?: string | null
  user_metadata?: {
    full_name?: string
    name?: string
    avatar_url?: string
    picture?: string
  }
}) {
  return user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'You'
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const name = getDisplayName(user)

  return NextResponse.json({
    user: {
      name,
      firstName: name.split(' ')[0] ?? name,
      avatarUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    },
  })
}
