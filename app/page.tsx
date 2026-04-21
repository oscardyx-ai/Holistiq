'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import VoiceCheckin from '@/components/VoiceCheckin'
import FamilyTab from '@/components/FamilyTab'
import InsightsDashboard from '@/components/InsightsDashboard'
import LearnTab from '@/components/LearnTab'
import LogoWordmark from '@/components/LogoWordmark'
import SelectChevron from '@/components/SelectChevron'
import UserAvatar from '@/components/UserAvatar'
import {
  WellnessState,
  getConsecutiveStreak,
  getFamilyNudgeCandidate,
  getGreetingForHour,
  getPeriodLabel,
  getSessionForDate,
  getTodayStatus,
  isWeeklyCheckInDue,
} from '@/components/checkInData'
import { useCheckInWindow } from '@/lib/use-check-in-window'
import {
  createEmptyWellnessState,
  createFamilyMember,
  fetchWellnessState,
  saveCheckIn,
  updateFamilyMemberSharing,
  updatePrivacySettings,
  updateReminderSettings,
} from '@/lib/wellness-api'
import type { VoiceCheckinData } from '@/components/VoiceCheckin'

type HomeTab = 'today' | 'insights' | 'learn' | 'family'
const HOME_TABS: HomeTab[] = ['today', 'insights', 'learn', 'family']

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1.5 18.93A8.001 8.001 0 0 1 4 12H6a6 6 0 0 0 12 0h2a8.001 8.001 0 0 1-6.5 7.93V22h-3v-2.07z" />
    </svg>
  )
}

function QuestionnaireCard({
  title,
  status,
  href,
  onVoiceTap,
  showVoiceButton,
}: {
  title: string
  status: string
  href: string
  onVoiceTap: () => void
  showVoiceButton: boolean
}) {
  return (
    <article className="rounded-[1.8rem] border border-stone-100 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[1.5rem] text-stone-900">{title}</h2>
          <p className="mt-3 text-sm text-stone-500">{status}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={href}
            className="inline-flex rounded-full bg-[linear-gradient(180deg,#f4f4f4_0%,#f0f0f0_100%)] px-5 py-3 text-sm font-semibold text-[#555555]"
          >
            Get Started
          </Link>
          {showVoiceButton ? (
            <button
              type="button"
              onClick={onVoiceTap}
              aria-label="Voice check-in"
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(180deg,#f4f4f4_0%,#f0f0f0_100%)] p-3 text-[#555555]"
            >
              <MicIcon />
            </button>
          ) : null}
        </div>
      </div>

    </article>
  )
}

export default function Home() {
  const checkInWindow = useCheckInWindow()
  const [state, setState] = useState<WellnessState>(createEmptyWellnessState)
  const [tab, setTab] = useState<HomeTab>('today')
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [firstName, setFirstName] = useState<string | null>(null)
  const [isLoadingState, setIsLoadingState] = useState(true)
  const [stateError, setStateError] = useState<string | null>(null)
  const [voiceCheckinPeriod, setVoiceCheckinPeriod] = useState<'morning' | 'night' | null>(null)

  const todayKey = checkInWindow.activeDateKey
  const activeDailyPeriod = checkInWindow.activePeriod
  const streak = getConsecutiveStreak(state.sessions, todayKey)
  const todayStatus = getTodayStatus(state.sessions, todayKey)
  const weeklyDue = isWeeklyCheckInDue(state.sessions, new Date(`${todayKey}T12:00:00`))
  const familyNudgeCandidate = getFamilyNudgeCandidate(state.familyMembers, state.sessions, todayKey)
  const needsMorningCatchUp =
    activeDailyPeriod === 'night' && !getSessionForDate(state.sessions, todayKey, 'morning')
  const activeCheckInComplete =
    activeDailyPeriod === 'morning'
      ? todayStatus.morningComplete
      : todayStatus.nightComplete && (!needsMorningCatchUp || todayStatus.morningComplete)
  const activeCheckInHref = `/check-in?period=${activeDailyPeriod}`
  const activeCheckInTitle = getPeriodLabel(activeDailyPeriod)
  const activeCheckInStatus = activeCheckInComplete ? 'Completed' : 'Open'
  const canUseVoiceCheckIn = true

  const greeting = firstName
    ? `${getGreetingForHour(checkInWindow.hour)}, ${firstName}`
    : getGreetingForHour(checkInWindow.hour)

  async function refreshState() {
    setIsLoadingState(true)
    setStateError(null)

    try {
      const nextState = await fetchWellnessState()
      setState(nextState)
    } catch {
      setStateError('Could not load your latest wellness data.')
    } finally {
      setIsLoadingState(false)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      const full = user?.user_metadata?.full_name ?? user?.user_metadata?.name
      setFirstName(full ? full.split(' ')[0] : null)
    })

    void refreshState()
  }, [])

  useEffect(() => {
    if (isLoadingState) {
      return
    }

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

        const nextReminders = {
          ...state.reminders,
          nightReminderLastSentDate: todayKey,
        }

        setState((currentState) => ({
          ...currentState,
          reminders: nextReminders,
        }))
        void updateReminderSettings(nextReminders)
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
          const nextReminders = {
            ...currentState.reminders,
            familyNudgeLastSentAt: familyNudgeCandidate.lastCheckInAt,
          }
          const nextState = {
            ...currentState,
            reminders: nextReminders,
          }
          void updateReminderSettings(nextReminders)
          return nextState
        })
      }, 0)
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [familyNudgeCandidate, isLoadingState, state, todayKey, todayStatus.nightComplete])

  function requestNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission)
    })
  }

  async function handleAddFamilyMember(input: { name: string; relation: string }) {
    await createFamilyMember(input)
    await refreshState()
  }

  async function handleUpdatePrivacy(nextPrivacy: WellnessState['privacy']) {
    const previousSharedIds = new Set(state.privacy.sharedFamilyMemberIds)
    const nextSharedIds = new Set(nextPrivacy.sharedFamilyMemberIds)

    setState((currentState) => ({
      ...currentState,
      privacy: nextPrivacy,
    }))

    try {
      await updatePrivacySettings(nextPrivacy)

      const changedMembers = state.familyMembers.filter((member) => {
        const previouslyShared = previousSharedIds.has(member.id)
        const nextShared = nextSharedIds.has(member.id)
        return previouslyShared !== nextShared
      })

      await Promise.all(
        changedMembers.map((member) =>
          updateFamilyMemberSharing(member.id, nextSharedIds.has(member.id))
        )
      )

      await refreshState()
    } catch {
      setStateError('Could not save your sharing preferences.')
      await refreshState()
    }
  }

  async function handleUpdateReminders(nextReminders: WellnessState['reminders']) {
    setState((currentState) => ({
      ...currentState,
      reminders: nextReminders,
    }))

    try {
      await updateReminderSettings(nextReminders)
    } catch {
      setStateError('Could not save your reminder settings.')
      await refreshState()
    }
  }

  async function handleVoiceSave(data: VoiceCheckinData) {
    const completedAt = new Date().toISOString()
    const period = voiceCheckinPeriod ?? 'night'

    const morningAnswers: Record<string, unknown> = {
      morning_feeling: data.mood,
      morning_energy: data.energy,
      morning_sleep: data.sleep,
    }
    const nightAnswers: Record<string, unknown> = {
      night_pain: data.pain,
      night_stress: data.stress,
      night_social_connection: data.connection,
      night_routine: data.routine,
      night_meals: data.meals,
      night_environment: data.environment,
      night_medication: data.medication,
      night_activity: data.activity,
    }

    try {
      if (period === 'morning') {
        await saveCheckIn({ entryDate: todayKey, period: 'morning', answers: morningAnswers, completedAt })
      } else {
        await saveCheckIn({ entryDate: todayKey, period: 'night', answers: nightAnswers, completedAt })
      }
      await refreshState()
    } catch {
      // silently fail — UI already moved to 'done' phase in VoiceCheckin
    }

    setVoiceCheckinPeriod(null)
  }

  const todayShortStatus = `${todayStatus.completedSlots}/2 today`

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="relative z-20 rounded-[2.5rem] border border-stone-100 bg-white px-6 py-5 shadow-[0_20px_80px_rgba(76,149,108,0.08)] sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => setTab('today')} className="text-left">
              <LogoWordmark compact />
            </button>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative sm:hidden">
                <label htmlFor="home-tab-select" className="sr-only">
                  Choose a dashboard section
                </label>
                <select
                  id="home-tab-select"
                  value={tab}
                  onChange={(event) => setTab(event.target.value as HomeTab)}
                  className="w-full appearance-none rounded-[1.2rem] border border-stone-200 bg-[#f0f0f0] px-4 py-3 pr-11 text-sm font-semibold capitalize text-stone-700 outline-none"
                >
                  {HOME_TABS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-stone-500">
                  <SelectChevron />
                </span>
              </div>

              <nav className="hidden flex-wrap items-center gap-2 rounded-full bg-[#f0f0f0] p-1 sm:flex">
                {HOME_TABS.map((item) => {
                  const active = tab === item

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTab(item)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                        active
                          ? 'bg-[linear-gradient(180deg,#56a86e_0%,#4c956c_100%)] text-white shadow-[0_10px_24px_rgba(76,149,108,0.22)]'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {item}
                    </button>
                  )
                })}
              </nav>
              <div className="self-start sm:self-auto">
                <UserAvatar />
              </div>
            </div>
          </div>
        </header>

        {stateError ? (
          <div className="rounded-[1.4rem] border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {stateError}
          </div>
        ) : null}

        {isLoadingState ? (
          <section className="rounded-[2.5rem] border border-stone-100 bg-white px-6 py-12 text-center shadow-[0_24px_80px_rgba(76,149,108,0.20)]">
            <p className="font-display text-3xl text-stone-900">Loading your wellness dashboard</p>
            <p className="mt-3 text-sm text-stone-500">Pulling check-ins, insights, family, and reminders from the backend.</p>
          </section>
        ) : null}

        {!isLoadingState && tab === 'today' ? (
          <section className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="rounded-[2.8rem] border border-stone-100 bg-white px-6 py-7 shadow-[0_28px_90px_rgba(76,149,108,0.20)] sm:px-8 sm:py-9"
            >
              <div className="p-5">
                <p className="font-semibold uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', color: '#888888' }}>Today&apos;s Check-In</p>
                <h1 className="font-display mt-2 max-w-3xl text-[2.5rem] font-semibold leading-tight text-stone-900">
                  {greeting}
                </h1>
                <p className="mt-2 text-sm text-stone-400">
                  {new Date(`${todayKey}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              {familyNudgeCandidate ? (
                <div className="mt-6 rounded-[1.6rem] border border-[#b8dcc9] bg-[#e0f5ec] px-5 py-4">
                  <p className="text-sm font-semibold text-[#2c6e49]">
                    {familyNudgeCandidate.name} checked in. Your turn is still open.
                  </p>
                </div>
              ) : null}

              <div className="mt-6">
                <QuestionnaireCard
                  title={activeCheckInTitle}
                  status={activeCheckInStatus}
                  href={activeCheckInHref}
                  onVoiceTap={() => setVoiceCheckinPeriod(activeDailyPeriod)}
                  showVoiceButton={canUseVoiceCheckIn}
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <article className="rounded-[1.8rem] border border-stone-100 bg-white p-5">
                  <p className="font-semibold uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', color: '#888888' }}>Streak</p>
                  <p className="font-display mt-3 text-4xl text-stone-900">{streak}</p>
                  {streak > 0 ? (
                    <p className="mt-2 text-sm text-stone-500">consecutive active days</p>
                  ) : null}
                </article>
                <article className="flex flex-col rounded-[1.8rem] border border-stone-100 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', color: '#888888' }}>Weekly review</p>
                      <p className="font-display mt-3 text-3xl text-stone-900">
                        {weeklyDue ? 'Due' : 'Done'}
                      </p>
                    </div>
                    <Link
                      href="/check-in?period=weekly"
                      className="inline-flex rounded-full bg-[linear-gradient(180deg,#f4f4f4_0%,#f0f0f0_100%)] px-5 py-3 text-sm font-semibold text-[#555555]"
                    >
                      Open weekly
                    </Link>
                  </div>
                </article>
              </div>

              {notificationPermission !== 'granted' ? (
                <button
                  type="button"
                  onClick={requestNotifications}
                  className="mt-5 inline-flex rounded-full bg-[linear-gradient(180deg,#f4f4f4_0%,#f0f0f0_100%)] px-5 py-3 text-sm font-semibold text-[#555555]"
                >
                  Enable browser reminders
                </button>
              ) : null}
            </motion.div>
          </section>
        ) : null}

        {!isLoadingState && tab === 'insights' ? <InsightsDashboard state={state} /> : null}

        {!isLoadingState && tab === 'learn' ? <LearnTab /> : null}

        {!isLoadingState && tab === 'family' ? (
          <FamilyTab
            familyMembers={state.familyMembers}
            privacy={state.privacy}
            reminders={state.reminders}
            onAddFamilyMember={handleAddFamilyMember}
            onUpdatePrivacy={handleUpdatePrivacy}
            onUpdateReminders={handleUpdateReminders}
          />
        ) : null}
      </div>

      <AnimatePresence>
        {voiceCheckinPeriod && (
          <motion.div
            key="voice-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
            onClick={(e) => { if (e.target === e.currentTarget) setVoiceCheckinPeriod(null) }}
          >
            <motion.div
              key="voice-sheet"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-stone-100 bg-white shadow-[0_-20px_60px_rgba(0,0,0,0.10)] sm:rounded-[2rem]"
              style={{ maxHeight: '90dvh' }}
            >
              <div className="flex items-center justify-between px-6 pb-2 pt-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
                  {voiceCheckinPeriod === 'morning' ? 'Day' : 'Night'} check-in
                </p>
                <button
                  type="button"
                  onClick={() => setVoiceCheckinPeriod(null)}
                  aria-label="Close"
                  className="rounded-full p-1.5 text-stone-400 transition hover:bg-[#f0f0f0] hover:text-stone-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
              <VoiceCheckin
                onSave={handleVoiceSave}
                onCancel={() => setVoiceCheckinPeriod(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
