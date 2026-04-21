'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type UserInfo = {
  name: string
  avatarUrl: string | null
}

function AvatarBadge({ user }: { user: UserInfo }) {
  if (user.avatarUrl) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.avatarUrl}
          alt={user.name}
          width={36}
          height={36}
          referrerPolicy="no-referrer"
          className="h-9 w-9 rounded-full object-cover ring-2 ring-[#b8dcc9]"
        />
        <span className="sr-only">{user.name}</span>
      </>
    )
  }

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e0f5ec] text-sm font-semibold text-[#2c6e49] ring-2 ring-[#b8dcc9]">
      {user.name[0].toUpperCase()}
    </span>
  )
}

export default function UserAvatar() {
  const router = useRouter()
  const menuId = useId()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

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
        setIsMenuOpen(false)
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

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current || !(event.target instanceof Node)) {
        return
      }

      if (!menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  async function handleSignOut() {
    const supabase = createClient()

    setSignOutError(null)
    setIsSigningOut(true)

    const { error } = await supabase.auth.signOut({ scope: 'local' })

    setIsSigningOut(false)

    if (error) {
      setSignOutError('Could not sign out. Please try again.')
      return
    }

    setIsMenuOpen(false)
    router.replace('/login')
    router.refresh()
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-[linear-gradient(180deg,#56a86e_0%,#4c956c_100%)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#3a7d56_0%,#2c6e49_100%)]"
      >
        Sign in
      </Link>
    )
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-controls={isMenuOpen ? menuId : undefined}
        aria-expanded={isMenuOpen}
        aria-label={`${user.name} account options`}
        disabled={isSigningOut}
        onClick={() => {
          setSignOutError(null)
          setIsMenuOpen((open) => !open)
        }}
        className="rounded-full transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a7c293] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-wait disabled:hover:translate-y-0"
      >
        <AvatarBadge user={user} />
      </button>

      {isMenuOpen ? (
        <div
          id={menuId}
          aria-label="Account options"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-56 rounded-[1.4rem] border border-stone-100 bg-white p-2 shadow-[0_18px_45px_rgba(76,149,108,0.14)]"
        >
          <div className="rounded-[1rem] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
              Signed in as
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-stone-800">{user.name}</p>
          </div>

          {signOutError ? (
            <p className="px-3 pb-2 text-sm text-red-600">{signOutError}</p>
          ) : null}

          <button
            type="button"
            disabled={isSigningOut}
            onClick={() => void handleSignOut()}
            className="flex w-full items-center justify-between rounded-[1rem] px-3 py-2 text-left text-sm font-semibold text-stone-700 transition hover:bg-[#f0f0f0] disabled:cursor-wait disabled:text-stone-400"
          >
            <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M10 17l5-5-5-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 12H3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M20 5v14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  )
}
