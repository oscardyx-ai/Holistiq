import type { Metadata } from 'next'
import { Baloo_2, Fraunces, Geist_Mono, Nunito } from 'next/font/google'
import './globals.css'

const bodyFont = Nunito({
  variable: '--font-holistiq-sans',
  subsets: ['latin'],
})

const displayFont = Fraunces({
  variable: '--font-holistiq-display',
  subsets: ['latin'],
})

const brandFont = Baloo_2({
  variable: '--font-holistiq-brand',
  subsets: ['latin'],
  weight: ['700', '800'],
})

const monoFont = Geist_Mono({
  variable: '--font-holistiq-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Holistiq',
  description: 'A calm daily check-in experience for tracking mood, sleep, pain, energy, and routines.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} ${brandFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  )
}
