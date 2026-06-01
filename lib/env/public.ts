type PublicEnvName = 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'

function validatePublicEnv(name: PublicEnvName, value: string) {
  if (name === 'NEXT_PUBLIC_SUPABASE_URL') {
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

  return value
}

export function getPublicEnv(name: PublicEnvName) {
  const value = process.env[name]

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in .env.local or your deployment settings.`,
    )
  }

  return validatePublicEnv(name, value)
}

export function getOptionalPublicEnv(name: PublicEnvName) {
  const value = process.env[name]

  if (!value) {
    return null
  }

  return validatePublicEnv(name, value)
}
