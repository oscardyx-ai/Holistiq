import 'server-only'

export function getServerEnv(name: 'SUPABASE_SERVICE_ROLE_KEY' | 'DEEPGRAM_API_KEY') {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}
