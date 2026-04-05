'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import JournalPage from '@/components/JournalPage'
import LearnTab from '@/components/LearnTab'
import LogoWordmark from '@/components/LogoWordmark'
import MoodGrid from '@/components/MoodGrid'
import PlantProgress from '@/components/PlantProgress'
import {
  DailyEntry,
  cloneEntryForDate,
  formatLongDate,
  getConsecutiveStreak,
  getGreetingForDate,
  getMonthlyGrowth,
  getSortedDateKeys,
  getTodayKey,
  getYesterdayEntry,
  readEntriesFromStorage,
  writeEntriesToStorage,
} from '@/components/checkInData'

type HomeTab = 'today' | 'learn' | 'history'

export default function Home() {
  const todayKey = getTodayKey()
  const [entries, setEntries] = useState<Record<string, DailyEntry>>(() => readEntriesFromStorage())
  const [selectedDate, setSelectedDate] = useState(() => getSortedDateKeys(readEntriesFromStorage())[0] ?? todayKey)
  const [tab, setTab] = useState<HomeTab>('today')
  const [notice, setNotice] = useState('')

  const greeting = getGreetingForDate()
  const todayEntry = entries[todayKey]
  const yesterdayEntry = getYesterdayEntry(entries, todayKey)
  const streak = getConsecutiveStreak(entries, todayKey)
  const monthlyGrowth = getMonthlyGrowth(entries, todayKey)

  function saveEntries(nextEntries: Record<string, DailyEntry>) {
    setEntries(nextEntries)
    writeEntriesToStorage(nextEntries)
    setSelectedDate(getSortedDateKeys(nextEntries)[0] ?? todayKey)
  }

  function sameAsYesterday() {
    if (!yesterdayEntry || todayEntry) {
      return
    }

    const copiedEntry = cloneEntryForDate(yesterdayEntry, todayKey)
    const nextEntries = {
      ...entries,
      [todayKey]: copiedEntry,
    }

    saveEntries(nextEntries)
    setNotice('Yesterday\'s answers were gently copied into today.')
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-[2.5rem] border border-white/70 bg-white/75 px-6 py-5 shadow-[0_20px_80px_rgba(120,133,107,0.12)] backdrop-blur-xl sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <LogoWordmark compact />

            <nav className="flex flex-wrap items-center gap-2 rounded-full bg-[#f5efdf] p-1">
              {(['today', 'learn', 'history'] as HomeTab[]).map((item) => {
                const active = tab === item

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTab(item)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                      active
                        ? 'bg-[#6f9658] text-white shadow-[0_10px_24px_rgba(111,150,88,0.22)]'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {item}
                  </button>
                )
              })}
            </nav>
          </div>
        </header>

        {tab === 'today' ? (
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="rounded-[2.8rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(249,243,231,0.9))] px-6 py-7 shadow-[0_30px_110px_rgba(120,133,107,0.16)] backdrop-blur-xl sm:px-8 sm:py-9"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6f8e58]">
                {formatLongDate(todayKey)}
              </p>
              <h1 className="font-display mt-5 text-5xl leading-[0.95] text-stone-900 sm:text-6xl">
                {greeting}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
                Your health story builds quietly, one gentle check-in at a time. Today&apos;s view
                keeps the greeting front and center, then lets your monthly plant show the care
                you&apos;ve been giving yourself.
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <article className="rounded-[1.8rem] border border-[#ece3d4] bg-white/75 p-5">
                  <p className="text-sm text-stone-500">Current streak</p>
                  <p className="font-display mt-3 text-4xl text-stone-900">{streak}</p>
                  <p className="mt-2 text-sm text-stone-500">
                    {streak === 1 ? 'consecutive day' : 'consecutive days'} of checking in.
                  </p>
                </article>

                <article className="rounded-[1.8rem] border border-[#ece3d4] bg-white/75 p-5">
                  <p className="text-sm text-stone-500">Today&apos;s status</p>
                  <p className="font-display mt-3 text-3xl text-stone-900">
                    {todayEntry ? 'Already checked in' : 'Ready when you are'}
                  </p>
                  <p className="mt-2 text-sm text-stone-500">
                    {todayEntry
                      ? 'You can review or update your answers any time.'
                      : 'A calm one-question flow is waiting for you.'}
                  </p>
                </article>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/check-in"
                  className="rounded-full bg-[#6f9658] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  {todayEntry ? 'Review today\'s check-in' : 'Check in for Today'}
                </Link>
                <button
                  type="button"
                  onClick={sameAsYesterday}
                  disabled={!yesterdayEntry || Boolean(todayEntry)}
                  className="rounded-full border border-[#d5e2c7] bg-[#eef5e5] px-6 py-3 text-sm font-semibold text-[#456246] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Same as yesterday
                </button>
              </div>

              <p className="mt-4 text-sm text-stone-500">
                {notice ||
                  (yesterdayEntry
                    ? 'If yesterday felt the same, you can log it instantly with one tap.'
                    : 'Once you have yesterday\'s entry, the quick-copy option will appear here.')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.04 }}
              className="space-y-6"
            >
              <PlantProgress
                stage={monthlyGrowth.stage}
                progress={monthlyGrowth.progress}
                monthLabel={monthlyGrowth.monthLabel}
                completedDays={monthlyGrowth.completedDays}
                daysInMonth={monthlyGrowth.daysInMonth}
              />

              <Link
                href="/check-in"
                className="block rounded-[1.9rem] bg-[#6f9658] px-6 py-4 text-center text-sm font-semibold text-white shadow-[0_18px_40px_rgba(111,150,88,0.22)] transition hover:-translate-y-0.5"
              >
                {todayEntry ? 'Review today\'s check-in' : 'Check in for Today'}
              </Link>

              <section className="rounded-[2.2rem] border border-white/70 bg-white/80 p-6 shadow-[0_22px_90px_rgba(120,133,107,0.12)] backdrop-blur-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6f8e58]">
                  Learn today
                </p>
                <h2 className="font-display mt-3 text-3xl text-stone-900">
                  One tab away from trusted reading
                </h2>
                <p className="mt-3 text-base leading-7 text-stone-600">
                  The Learn tab refreshes each day with patient-friendly articles across feeling,
                  energy, sleep, pain, stress, activity, and medication routines.
                </p>
                <button
                  type="button"
                  onClick={() => setTab('learn')}
                  className="mt-5 rounded-full border border-[#d8e5ca] bg-[#eef5e5] px-5 py-3 text-sm font-semibold text-[#456246] transition hover:-translate-y-0.5"
                >
                  Open Learn
                </button>
              </section>
            </motion.div>
          </section>
        ) : null}

        {tab === 'learn' ? <LearnTab /> : null}

        {tab === 'history' ? (
          <section className="space-y-6">
            <JournalPage
              entries={entries}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <MoodGrid entries={entries} />
          </section>
        ) : null}
      </div>
    </main>
  )
}
