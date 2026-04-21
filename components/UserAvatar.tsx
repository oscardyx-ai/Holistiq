'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type UserInfo = {
  name: string
  avatarUrl: string | null
}

export default function UserAvatar() {
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setUser(null)
        return
      }
      const meta = session.user.user_metadata
      setUser({
        name: meta?.full_name ?? meta?.name ?? session.user.email ?? 'You',
        avatarUrl: meta?.avatar_url ?? meta?.picture ?? null,
      })
    }

    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null)
        return
      }
      const meta = session.user.user_metadata
      setUser({
        name: meta?.full_name ?? meta?.name ?? session.user.email ?? 'You',
        avatarUrl: meta?.avatar_url ?? meta?.picture ?? null,
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-[#6f9658] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
      >
        Sign in
      </Link>
    )
  }

  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={user.name}
        width={36}
        height={36}
        referrerPolicy="no-referrer"
        className="h-9 w-9 rounded-full object-cover ring-2 ring-[#d5e2c7]"
      />
    )
  }

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef5e5] text-sm font-semibold text-[#456246] ring-2 ring-[#d5e2c7]">
      {user.name[0].toUpperCase()}
    </span>
  )
}
