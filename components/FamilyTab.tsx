'use client'

import { useState } from 'react'
import { FamilyMember } from '@/components/checkInData'

interface FamilyTabProps {
  familyMembers: FamilyMember[]
  onAddFamilyMember: (input: { name: string; relation: string }) => Promise<void>
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
    <section className="rounded-[2rem] border border-stone-100 bg-white p-6 shadow-[0_18px_64px_rgba(76,149,108,0.12)]">
      <h2 className="font-display text-3xl text-stone-900">{title}</h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
}

export default function FamilyTab({
  familyMembers,
  onAddFamilyMember,
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
    <Panel
      title="Family"
      description="Invite family members, keep an eye on streaks, and nudge each other to check in without exposing private health details by default."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {familyMembers.map((member) => (
          <article
            key={member.id}
            className="rounded-[1.6rem] border border-stone-100 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-stone-900">{member.name}</p>
                <p className="text-sm text-stone-500">{member.relation}</p>
              </div>
              <div className="shrink-0 rounded-full bg-[#e0f5ec] px-3 py-2 text-xs font-semibold text-[#2c6e49]">
                {member.checkedInToday ? 'Checked in today' : 'Still open today'}
              </div>
            </div>

            <div className="mt-4 rounded-[1.2rem] bg-white px-4 py-3">
              <p className="text-sm text-stone-500">Current streak</p>
              <p className="font-display mt-2 text-3xl text-stone-900">{member.streak}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-[1.6rem] border border-dashed border-stone-200 bg-white p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4c956c]">
          Invite
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={inviteName}
            onChange={(event) => setInviteName(event.target.value)}
            placeholder="Family member name"
            className="rounded-[1rem] border border-[#e0e0e0] bg-white px-4 py-3 text-sm text-stone-700 outline-none"
          />
          <input
            value={inviteRelation}
            onChange={(event) => setInviteRelation(event.target.value)}
            placeholder="Relation"
            className="rounded-[1rem] border border-[#e0e0e0] bg-white px-4 py-3 text-sm text-stone-700 outline-none"
          />
          <button
            type="button"
            onClick={() => void addMember()}
            disabled={isSubmittingInvite}
            className="rounded-[1rem] bg-[linear-gradient(180deg,#56a86e_0%,#4c956c_100%)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[linear-gradient(180deg,#3a7d56_0%,#2c6e49_100%)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmittingInvite ? 'Adding...' : 'Add to family'}
          </button>
        </div>
      </div>
    </Panel>
  )
}
