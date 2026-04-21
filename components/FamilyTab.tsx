'use client'

import { useState } from 'react'
import {
  FamilyMember,
  PrivacySettings,
  ReminderSettings,
} from '@/components/checkInData'

interface FamilyTabProps {
  familyMembers: FamilyMember[]
  privacy: PrivacySettings
  reminders: ReminderSettings
  onAddFamilyMember: (input: { name: string; relation: string }) => Promise<void>
  onUpdatePrivacy: (privacy: PrivacySettings) => Promise<void>
  onUpdateReminders: (reminders: ReminderSettings) => Promise<void>
}

function Panel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-[0_18px_64px_rgba(190,198,189,0.18)] backdrop-blur-xl">
      <h2 className="font-display text-3xl text-stone-900">{title}</h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
}

export default function FamilyTab({
  familyMembers,
  privacy,
  reminders,
  onAddFamilyMember,
  onUpdatePrivacy,
  onUpdateReminders,
}: FamilyTabProps) {
  const [inviteName, setInviteName] = useState('')
  const [inviteRelation, setInviteRelation] = useState('')
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false)

  async function addMember() {
    const name = inviteName.trim()

    if (!name || isSubmittingInvite) {
      return
    }

    setIsSubmittingInvite(true)

    try {
      await onAddFamilyMember({
        name,
        relation: inviteRelation.trim() || 'Family member',
      })
    } finally {
      setIsSubmittingInvite(false)
    }

    setInviteName('')
    setInviteRelation('')
  }

  return (
    <section className="space-y-6">
      <Panel
        title="Family"
        description="Invite family members, keep an eye on streaks, and nudge each other to check in without exposing private health details by default."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {familyMembers.map((member) => (
            <article
              key={member.id}
              className="rounded-[1.6rem] border border-[#ece3d4] bg-[#fcfaf5] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-stone-900">{member.name}</p>
                  <p className="text-sm text-stone-500">{member.relation}</p>
                </div>
                <div className="shrink-0 rounded-full bg-[#eef5e5] px-3 py-2 text-xs font-semibold text-[#456246]">
                  {member.checkedInToday ? 'Checked in today' : 'Still open today'}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] bg-white px-4 py-3">
                  <p className="text-sm text-stone-500">Current streak</p>
                  <p className="font-display mt-2 text-3xl text-stone-900">{member.streak}</p>
                </div>
                <div className="rounded-[1.2rem] bg-white px-4 py-3">
                  <p className="text-sm text-stone-500">Sharing</p>
                  <p className="mt-2 text-sm font-semibold text-stone-900">
                    {privacy.sharedFamilyMemberIds.includes(member.id) &&
                    privacy.shareGraphsWithFamily
                      ? 'Can view graphs'
                      : 'No graph access'}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-[1.6rem] border border-dashed border-[#d9cfbf] bg-white/70 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6f8e58]">
            Invite
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
              placeholder="Family member name"
              className="rounded-[1rem] border border-[#ded4c5] bg-white px-4 py-3 text-sm text-stone-700 outline-none"
            />
            <input
              value={inviteRelation}
              onChange={(event) => setInviteRelation(event.target.value)}
              placeholder="Relation"
              className="rounded-[1rem] border border-[#ded4c5] bg-white px-4 py-3 text-sm text-stone-700 outline-none"
            />
            <button
              type="button"
              onClick={() => void addMember()}
              disabled={isSubmittingInvite}
              className="rounded-[1rem] bg-[#6f9658] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingInvite ? 'Adding...' : 'Add to family'}
            </button>
          </div>
        </div>
      </Panel>

      <Panel
        title="Privacy"
        description="Personal health data stays private by default. Turn sharing on only if you want specific family members to see your graphs."
      >
        <div className="space-y-4">
          <label className="flex flex-col gap-4 rounded-[1.5rem] border border-[#ece3d4] bg-[#fcfaf5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-stone-900">Allow graph sharing</p>
              <p className="text-sm text-stone-500">
                Lets selected family members view your radar and line charts.
              </p>
            </div>
            <input
              type="checkbox"
              checked={privacy.shareGraphsWithFamily}
              onChange={(event) =>
                void onUpdatePrivacy({
                  ...privacy,
                  shareGraphsWithFamily: event.target.checked,
                })
              }
              className="h-5 w-5 accent-[#6f9658]"
            />
          </label>

          {privacy.shareGraphsWithFamily ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {familyMembers.map((member) => {
                const selected = privacy.sharedFamilyMemberIds.includes(member.id)

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() =>
                      void onUpdatePrivacy({
                        ...privacy,
                        sharedFamilyMemberIds: selected
                          ? privacy.sharedFamilyMemberIds.filter((id) => id !== member.id)
                          : [...privacy.sharedFamilyMemberIds, member.id],
                      })
                    }
                    className={`rounded-[1.4rem] border px-4 py-4 text-left transition ${
                      selected
                        ? 'border-[#6f9658] bg-[#eef5e5]'
                        : 'border-[#ece3d4] bg-white'
                    }`}
                  >
                    <p className="font-semibold text-stone-900">{member.name}</p>
                    <p className="mt-1 text-sm text-stone-500">{member.relation}</p>
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </Panel>

      <Panel
        title="Notifications"
        description="Night reminders and family nudges can encourage consistency. In this prototype they use browser notifications when the app is open."
      >
        <div className="space-y-4">
          <label className="flex flex-col gap-4 rounded-[1.5rem] border border-[#ece3d4] bg-[#fcfaf5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-stone-900">Night reminder</p>
              <p className="text-sm text-stone-500">
                Sends a reminder in the evening if the night check-in is still open.
              </p>
            </div>
            <input
              type="checkbox"
              checked={reminders.nightReminderEnabled}
              onChange={(event) =>
                void onUpdateReminders({
                  ...reminders,
                  nightReminderEnabled: event.target.checked,
                })
              }
              className="h-5 w-5 accent-[#6f9658]"
            />
          </label>

          <label className="flex flex-col gap-4 rounded-[1.5rem] border border-[#ece3d4] bg-[#fcfaf5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-stone-900">Family nudge</p>
              <p className="text-sm text-stone-500">
                Sends a notification when another family member checks in and you have not yet.
              </p>
            </div>
            <input
              type="checkbox"
              checked={reminders.familyNudgesEnabled}
              onChange={(event) =>
                void onUpdateReminders({
                  ...reminders,
                  familyNudgesEnabled: event.target.checked,
                })
              }
              className="h-5 w-5 accent-[#6f9658]"
            />
          </label>
        </div>
      </Panel>
    </section>
  )
}
