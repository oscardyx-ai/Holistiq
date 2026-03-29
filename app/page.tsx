'use client'

import { useState } from 'react'
import CheckInModal from '@/components/CheckInModal'
import JournalPage from '@/components/JournalPage'
import MoodGrid from '@/components/MoodGrid'
import { DailyEntry, STORAGE_KEY, formatLongDate, getTodayKey } from '@/components/checkInData'

type Tab = 'check-in' | 'journal' | 'summary'

function readEntries(): Record<string, DailyEntry> {
  if (typeof window === 'undefined') {
    return {}
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw) as Record<string, DailyEntry>
  } catch {
    return {}
  }
}

export default function Home() {
  const todayKey = getTodayKey()
  const [entries, setEntries] = useState<Record<string, DailyEntry>>(() => readEntries())
  const [selectedDate, setSelectedDate] = useState(() => {
    const availableDates = Object.keys(readEntries()).sort((a, b) => b.localeCompare(a))
    return availableDates[0] ?? todayKey
  })
  const [tab, setTab] = useState<Tab>('check-in')

  function saveEntry(entry: DailyEntry) {
    setEntries((prev) => {
      const nextEntries = {
        ...prev,
        [entry.date]: entry,
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries))

      return nextEntries
    })

    setSelectedDate(entry.date)
    setTab('journal')
  }

  const todayEntry = entries[todayKey]

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/85 px-6 py-8 shadow-[0_30px_120px_rgba(193,203,193,0.35)] backdrop-blur-xl sm:px-10 sm:py-12">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(227,235,230,0.9),_transparent_60%)]" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-stone-400">
                Holistiq
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
                Gentle daily check-ins for a fuller picture of health.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-stone-500 sm:text-lg">
                Track how you feel, how you slept, your energy, stress, activity, medication,
                and pain one calm question at a time. Each response is saved to its day so the
                journal and summary views can turn everyday moments into clearer patterns.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[25rem]">
              <div className="rounded-[1.6rem] border border-stone-200 bg-white/90 p-5">
                <p className="text-sm text-stone-500">Today</p>
                <p className="mt-3 text-lg font-semibold text-stone-900">{formatLongDate(todayKey)}</p>
              </div>
              <div className="rounded-[1.6rem] border border-stone-200 bg-white/90 p-5">
                <p className="text-sm text-stone-500">Status</p>
                <p className="mt-3 text-lg font-semibold text-stone-900">
                  {todayEntry ? 'Saved for today' : 'Ready for today'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          {(['check-in', 'journal', 'summary'] as Tab[]).map((item) => {
            const active = tab === item

            return (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`rounded-full px-5 py-3 text-sm font-medium capitalize transition-all ${
                  active
                    ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/10'
                    : 'bg-white/80 text-stone-500 hover:bg-white hover:text-stone-800'
                }`}
              >
                {item}
              </button>
            )
          })}
        </div>

        {tab === 'check-in' ? (
          <CheckInModal
            key={todayEntry?.completedAt ?? `today-${todayKey}`}
            existingEntry={todayEntry}
            onComplete={saveEntry}
          />
        ) : null}

        {tab === 'journal' ? (
          <JournalPage
            entries={entries}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        ) : null}

        {tab === 'summary' ? <MoodGrid entries={entries} /> : null}
      </div>
    </main>
  )
}
