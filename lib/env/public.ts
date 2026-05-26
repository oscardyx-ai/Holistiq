const BROKEN_SUPABASE_URL = 'https://wsachiytaiqzzwkpgzko.supabase.co'
const BROKEN_SUPABASE_ANON_KEY = 'sb_publishable_oZPDZz1PCQuPN6AxiG_Kaw_u4w374vz'

export function getPublicEnv(
  name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
) {
  const value = process.env[name]

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in .env.local or your deployment settings.`,
    )
  }

  if (name === 'NEXT_PUBLIC_SUPABASE_URL') {
    if (value === BROKEN_SUPABASE_URL) {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL still points at the retired Supabase project wsachiytaiqzzwkpgzko. Replace it with your active project URL.',
      )
    }

    try {
      const parsed = new URL(value)
      const isSupabaseHost = parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co')

      if (!isSupabaseHost) {
        throw new Error('invalid')
      }
    } catch {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL must be a valid https://<project-ref>.supabase.co URL.',
      )
    }
  }

  if (name === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && value === BROKEN_SUPABASE_ANON_KEY) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY still points at the retired Supabase project. Replace it with the anon key from your active project.',
    )
  }

  return value
}
