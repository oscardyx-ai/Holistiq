'use client'

import { useState } from 'react'
import CheckInModal from '@/components/CheckInModal'
import JournalPage from '@/components/JournalPage'
import MoodGrid from '@/components/MoodGrid'

type Tab = 'journal' | 'summary'

export default function Home() {
  const [moodScore, setMoodScore] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('journal')

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center py-12 px-4">
      {moodScore === null && <CheckInModal onComplete={setMoodScore} />}

      {/* Tabs */}
      <div className="flex gap-6 mb-8">
        {(['journal', 'summary'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors capitalize ${
              tab === t
                ? 'text-white border-white'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="w-full max-w-sm">
        {tab === 'journal' && <JournalPage moodScore={moodScore ?? undefined} />}
        {tab === 'summary' && <MoodGrid />}
      </div>
    </div>
  )
}
