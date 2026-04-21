const PUBLIC_ENV_DEFAULTS = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://wsachiytaiqzzwkpgzko.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_oZPDZz1PCQuPN6AxiG_Kaw_u4w374vz',
} as const

export function getPublicEnv(
  name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
) {
  const value = process.env[name] ?? PUBLIC_ENV_DEFAULTS[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}
