'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import LogoWordmark from '@/components/LogoWordmark'
import UserAvatar from '@/components/UserAvatar'
import { type WellnessState } from '@/components/checkInData'
import {
  createEmptyWellnessState,
  fetchWellnessState,
  updateFamilyMemberSharing,
  updatePrivacySettings,
  updateReminderSettings,
} from '@/lib/wellness-api'

function Panel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[2rem] border border-stone-100 bg-white p-6 shadow-[0_18px_64px_rgba(76,149,108,0.12)]">
      <h2 className="font-display text-3xl text-stone-900">{title}</h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex flex-col gap-4 rounded-[1.5rem] border border-stone-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-stone-900">{title}</p>
        <p className="text-sm text-stone-500">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[#4c956c]"
      />
    </label>
  )
}

export default function SettingsPageClient() {
  const [state, setState] = useState<WellnessState>(createEmptyWellnessState)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [supportsNotifications, setSupportsNotifications] = useState(true)
  const [isLoadingState, setIsLoadingState] = useState(true)
  const [stateError, setStateError] = useState<string | null>(null)

  async function refreshState() {
    setIsLoadingState(true)
    setStateError(null)

    try {
      const nextState = await fetchWellnessState()
      setState(nextState)
    } catch {
      setStateError('Could not load your settings right now.')
    } finally {
      setIsLoadingState(false)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setSupportsNotifications(false)
      return
    }

    setNotificationPermission(Notification.permission)
  }, [])

  useEffect(() => {
    void refreshState()
  }, [])

  async function requestNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setSupportsNotifications(false)
      return
    }

    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
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

  const browserReminderStatus = !supportsNotifications
    ? 'Unavailable'
    : notificationPermission === 'granted'
      ? 'Enabled'
      : notificationPermission === 'denied'
        ? 'Blocked'
        : 'Not enabled'

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-[2.5rem] border border-stone-100 bg-white px-6 py-5 shadow-[0_20px_80px_rgba(76,149,108,0.08)] sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-left">
                <LogoWordmark compact />
              </Link>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Account
                </p>
                <h1 className="font-display text-3xl text-stone-900">Settings</h1>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <Link
                href="/"
                className="inline-flex rounded-full bg-[linear-gradient(180deg,#f4f4f4_0%,#f0f0f0_100%)] px-5 py-3 text-sm font-semibold text-[#555555]"
              >
                Back to dashboard
              </Link>
              <UserAvatar />
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
            <p className="font-display text-3xl text-stone-900">Loading your settings</p>
            <p className="mt-3 text-sm text-stone-500">Pulling reminder, privacy, and family preferences from the backend.</p>
          </section>
        ) : null}

        {!isLoadingState ? (
          <div className="space-y-6">
            <Panel
              title="Browser reminders"
              description="Control whether this browser can show notification prompts for Holistiq. Browser reminders only arrive while the app is open."
            >
              <div className="flex flex-col gap-4 rounded-[1.5rem] border border-stone-100 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-stone-900">Permission status</p>
                  <p className="mt-1 text-sm text-stone-500">
                    {supportsNotifications
                      ? `Current status: ${browserReminderStatus}.`
                      : 'This browser does not support notifications.'}
                  </p>
                </div>

                {supportsNotifications && notificationPermission !== 'granted' ? (
                  <button
                    type="button"
                    onClick={() => void requestNotifications()}
                    className="inline-flex rounded-full bg-[linear-gradient(180deg,#56a86e_0%,#4c956c_100%)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[linear-gradient(180deg,#3a7d56_0%,#2c6e49_100%)]"
                  >
                    Enable browser reminders
                  </button>
                ) : (
                  <div className="rounded-full bg-[#e0f5ec] px-4 py-2 text-sm font-semibold text-[#2c6e49]">
                    {browserReminderStatus}
                  </div>
                )}
              </div>
            </Panel>

            <Panel
              title="Notifications"
              description="Night reminders and family nudges can encourage consistency. These controls manage which prompts Holistiq should try to send."
            >
              <div className="space-y-4">
                <ToggleCard
                  title="Night reminder"
                  description="Sends a reminder in the evening if the night check-in is still open."
                  checked={state.reminders.nightReminderEnabled}
                  onChange={(checked) =>
                    void handleUpdateReminders({
                      ...state.reminders,
                      nightReminderEnabled: checked,
                    })
                  }
                />

                <ToggleCard
                  title="Family nudge"
                  description="Sends a notification when another family member checks in and you have not yet."
                  checked={state.reminders.familyNudgesEnabled}
                  onChange={(checked) =>
                    void handleUpdateReminders({
                      ...state.reminders,
                      familyNudgesEnabled: checked,
                    })
                  }
                />
              </div>
            </Panel>

            <Panel
              title="Privacy"
              description="Personal health data stays private by default. Turn sharing on only if you want specific family members to see your graphs."
            >
              <div className="space-y-4">
                <ToggleCard
                  title="Allow graph sharing"
                  description="Lets selected family members view your radar and line charts."
                  checked={state.privacy.shareGraphsWithFamily}
                  onChange={(checked) =>
                    void handleUpdatePrivacy({
                      ...state.privacy,
                      shareGraphsWithFamily: checked,
                    })
                  }
                />

                {state.privacy.shareGraphsWithFamily && state.familyMembers.length ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {state.familyMembers.map((member) => {
                      const selected = state.privacy.sharedFamilyMemberIds.includes(member.id)

                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() =>
                            void handleUpdatePrivacy({
                              ...state.privacy,
                              sharedFamilyMemberIds: selected
                                ? state.privacy.sharedFamilyMemberIds.filter((id) => id !== member.id)
                                : [...state.privacy.sharedFamilyMemberIds, member.id],
                            })
                          }
                          className={`rounded-[1.4rem] border px-4 py-4 text-left transition ${
                            selected
                              ? 'border-[#4c956c] bg-[#e0f5ec]'
                              : 'border-stone-100 bg-white'
                          }`}
                        >
                          <p className="font-semibold text-stone-900">{member.name}</p>
                          <p className="mt-1 text-sm text-stone-500">{member.relation}</p>
                        </button>
                      )
                    })}
                  </div>
                ) : null}

                {state.privacy.shareGraphsWithFamily && !state.familyMembers.length ? (
                  <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-[#fcfcfa] px-5 py-4 text-sm text-stone-500">
                    Add family members first to choose who can see your graphs.
                  </div>
                ) : null}
              </div>
            </Panel>
          </div>
        ) : null}
      </div>
    </main>
  )
}
