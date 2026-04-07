'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type UserInfo = {
  name: string
  avatarUrl: string | null
}

export default function UserAvatar() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    setMounted(true)
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

  if (!mounted) return null

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

  return (
    <div className="flex items-center gap-2.5">
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl}
          alt={user.name}
          width={36}
          height={36}
          className="h-9 w-9 rounded-full ring-2 ring-[#d5e2c7]"
        />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef5e5] text-sm font-semibold text-[#456246] ring-2 ring-[#d5e2c7]">
          {user.name[0].toUpperCase()}
        </span>
      )}
    </div>
  )
}
