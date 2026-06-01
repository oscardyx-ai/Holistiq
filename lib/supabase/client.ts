import { createBrowserClient } from '@supabase/ssr'
import { getOptionalPublicEnv, getPublicEnv } from '@/lib/env/public'

export function createClient() {
  return createBrowserClient(
    getPublicEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getPublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  )
}

export function createOptionalClient() {
  const url = getOptionalPublicEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = getOptionalPublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  if (!url || !anonKey) {
    return null
  }

  return createBrowserClient(url, anonKey)
}
