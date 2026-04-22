import type { Metadata } from 'next'
import SettingsPageClient from '@/components/SettingsPageClient'

export const metadata: Metadata = {
  title: 'Settings | Holistiq',
}

export default function SettingsPage() {
  return <SettingsPageClient />
}
