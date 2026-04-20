'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import FamilyTab from '@/components/FamilyTab'
import InsightsDashboard from '@/components/InsightsDashboard'
import LearnTab from '@/components/LearnTab'
import LogoWordmark from '@/components/LogoWordmark'
import UserAvatar from '@/components/UserAvatar'
import PlantProgress from '@/components/PlantProgress'
import {
  createDefaultState,
  WellnessState,
  getConsecutiveStreak,
  getDailyStatusLabel,
  getFamilyNudgeCandidate,
  getGreetingForDate,
  getMonthProgress,
  getTodayKey,
  getTodayStatus,
  isWeeklyCheckInDue,
  readWellnessState,
  writeWellnessState,
} from '@/components/checkInData'

type HomeTab = 'today' | 'insights' | 'learn' | 'family'

function StatusCard({
  title,
  status,
  href,
  helper,
}: {
  title: string
  status: string
  href: string
  helper: string
}) {
  return (
    <article className="rounded-[1.8rem] border border-[#ece3d4] bg-white/84 p-5">
      <p className="text-sm text-stone-500">{title}</p>
      <p className="font-display mt-3 text-3xl text-stone-900">{status}</p>
      <p className="mt-2 text-sm text-stone-500">{helper}</p>
      <Link
        href={href}
        className="mt-5 inline-flex rounded-full bg-[#6f9658] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
      >
        Open
      </Link>
    </article>
  )
}

export default function Home() {
  const [state, setState] = useState<WellnessState>(() => createDefaultState())
  const [tab, setTab] = useState<HomeTab>('today')
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [firstName, setFirstName] = useState<string | null>(null)

  const todayKey = getTodayKey()
  const monthProgress = getMonthProgress(state.sessions, todayKey)
  const streak = getConsecutiveStreak(state.sessions, todayKey)
  const todayStatus = getTodayStatus(state.sessions, todayKey)
  const weeklyDue = isWeeklyCheckInDue(state.sessions)
  const familyNudgeCandidate = getFamilyNudgeCandidate(state.familyMembers, state.sessions, todayKey)

  const greeting = firstName
    ? `${getGreetingForDate()}, ${firstName}`
    : getGreetingForDate()

  useEffect(() => {
    setState(readWellnessState())

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      const full = user?.user_metadata?.full_name ?? user?.user_metadata?.name
      setFirstName(full ? full.split(' ')[0] : null)
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    if (Notification.permission !== 'granted') {
      return
    }

    const now = new Date()
    const nightComplete = todayStatus.nightComplete
    let timeoutId: number | undefined

    if (state.reminders.nightReminderEnabled && !nightComplete) {
      const reminderTime = new Date()
      reminderTime.setHours(state.reminders.nightReminderHour, 0, 0, 0)

      const sendNightReminder = () => {
        new Notification('Holistiq', {
          body: 'Night check-in is still open. Take a calm minute to log today.',
        })

        const nextState = {
          ...state,
          reminders: {
            ...state.reminders,
            nightReminderLastSentDate: todayKey,
          },
        }
        setState(nextState)
        writeWellnessState(nextState)
      }

      if (
        now >= reminderTime &&
        state.reminders.nightReminderLastSentDate !== todayKey
      ) {
        sendNightReminder()
      } else if (now < reminderTime) {
        timeoutId = window.setTimeout(sendNightReminder, reminderTime.getTime() - now.getTime())
      }
    }

    if (
      state.reminders.familyNudgesEnabled &&
      familyNudgeCandidate &&
      state.reminders.familyNudgeLastSentAt !== familyNudgeCandidate.lastCheckInAt
    ) {
      new Notification('Family check-in', {
        body: `${familyNudgeCandidate.name} checked in. Your turn is still open today.`,
      })

      window.setTimeout(() => {
        setState((currentState) => {
          const nextState = {
            ...currentState,
            reminders: {
              ...currentState.reminders,
              familyNudgeLastSentAt: familyNudgeCandidate.lastCheckInAt,
            },
          }
          writeWellnessState(nextState)
          return nextState
        })
      }, 0)
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [familyNudgeCandidate, state, todayKey, todayStatus.nightComplete])

  function requestNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission)
    })
  }

  function updateState(nextState: WellnessState) {
    setState(nextState)
    writeWellnessState(nextState)
  }

  const todayShortStatus = `${todayStatus.completedSlots}/2 today`

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-[2.5rem] border border-white/70 bg-white/75 px-6 py-5 shadow-[0_20px_80px_rgba(120,133,107,0.12)] backdrop-blur-xl sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <LogoWordmark compact />

            <div className="flex items-center gap-4">
              <nav className="flex flex-wrap items-center gap-2 rounded-full bg-[#f5efdf] p-1">
                {(['today', 'insights', 'learn', 'family'] as HomeTab[]).map((item) => {
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
              <UserAvatar />
            </div>
          </div>
        </header>

        {tab === 'today' ? (
          <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="rounded-[2.8rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(249,243,231,0.9))] px-6 py-7 shadow-[0_30px_110px_rgba(120,133,107,0.16)] backdrop-blur-xl sm:px-8 sm:py-9"
            >
              <h1 className="font-display text-5xl leading-[0.95] text-stone-900 sm:text-6xl whitespace-nowrap">
                {greeting}
              </h1>
              <p className="mt-4 text-base text-stone-500">{todayShortStatus}</p>

              {familyNudgeCandidate ? (
                <div className="mt-6 rounded-[1.6rem] border border-[#d8e5ca] bg-[#eef5e5] px-5 py-4">
                  <p className="text-sm font-semibold text-[#456246]">
                    {familyNudgeCandidate.name} checked in. Your turn is still open.
                  </p>
                </div>
              ) : null}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <StatusCard
                  title="Day"
                  status={getDailyStatusLabel(state.sessions, todayKey, 'morning')}
                  href="/check-in?period=morning"
                  helper="Morning questions"
                />
                <StatusCard
                  title="Night"
                  status={getDailyStatusLabel(state.sessions, todayKey, 'night')}
                  href="/check-in?period=night"
                  helper="Evening questions"
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <article className="rounded-[1.8rem] border border-[#ece3d4] bg-white/84 p-5">
                  <p className="text-sm text-stone-500">Streak</p>
                  <p className="font-display mt-3 text-4xl text-stone-900">{streak}</p>
                  <p className="mt-2 text-sm text-stone-500">consecutive active days</p>
                </article>
                <article className="rounded-[1.8rem] border border-[#ece3d4] bg-white/84 p-5">
                  <p className="text-sm text-stone-500">Weekly review</p>
                  <p className="font-display mt-3 text-3xl text-stone-900">
                    {weeklyDue ? 'Due' : 'Done'}
                  </p>
                  <Link
                    href="/check-in?period=weekly"
                    className="mt-5 inline-flex rounded-full border border-[#d5e2c7] bg-[#eef5e5] px-5 py-3 text-sm font-semibold text-[#456246]"
                  >
                    Open weekly
                  </Link>
                </article>
              </div>

              {notificationPermission !== 'granted' ? (
                <button
                  type="button"
                  onClick={requestNotifications}
                  className="mt-5 rounded-full border border-[#d5e2c7] bg-[#eef5e5] px-5 py-3 text-sm font-semibold text-[#456246]"
                >
                  Enable browser reminders
                </button>
              ) : null}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.04 }}
              className="space-y-6"
            >
              <PlantProgress
                stage={monthProgress.stage}
                progress={monthProgress.progress}
                monthLabel={monthProgress.monthLabel}
                completedSlots={monthProgress.completedSlots}
                targetSlots={monthProgress.targetSlots}
              />

              <section className="rounded-[2.2rem] border border-white/70 bg-white/80 p-6 shadow-[0_22px_90px_rgba(120,133,107,0.12)] backdrop-blur-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6f8e58]">
                  Factors
                </p>
                <h2 className="font-display mt-3 text-3xl text-stone-900">
                  Pain, mind, social, lifestyle, diet, environment, medication, and activity
                </h2>
                <button
                  type="button"
                  onClick={() => setTab('insights')}
                  className="mt-5 rounded-full border border-[#d8e5ca] bg-[#eef5e5] px-5 py-3 text-sm font-semibold text-[#456246] transition hover:-translate-y-0.5"
                >
                  Open insights
                </button>
              </section>
            </motion.div>
          </section>
        ) : null}

        {tab === 'insights' ? <InsightsDashboard state={state} /> : null}

        {tab === 'learn' ? <LearnTab /> : null}

        {tab === 'family' ? (
          <FamilyTab
            familyMembers={state.familyMembers}
            privacy={state.privacy}
            reminders={state.reminders}
            onUpdateFamilyMembers={(familyMembers) => updateState({ ...state, familyMembers })}
            onUpdatePrivacy={(privacy) => updateState({ ...state, privacy })}
            onUpdateReminders={(reminders) => updateState({ ...state, reminders })}
          />
        ) : null}
      </div>
    </main>
  )
}
