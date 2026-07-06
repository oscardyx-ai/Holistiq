'use client'

import type { PatientFlag } from '@/lib/questionnaire/types'

interface SafetyScreenProps {
  flags: PatientFlag[]
  onContinue: () => void
  onExit: () => void
}

interface ResourceItem {
  name: string
  detail: string
  action: string
  href: string
}

const CRISIS_RESOURCES: ResourceItem[] = [
  {
    name: '988 Suicide & Crisis Lifeline',
    detail: 'Call or text 988 — free, confidential, 24/7',
    action: 'Call or text 988',
    href: 'tel:988',
  },
  {
    name: 'Crisis Text Line',
    detail: 'Text HOME to 741741',
    action: 'Text 741741',
    href: 'sms:741741&body=HOME',
  },
  {
    name: 'Emergency Services',
    detail: 'For immediate physical danger',
    action: 'Call 911',
    href: 'tel:911',
  },
]

const SAFETY_RESOURCES: ResourceItem[] = [
  {
    name: 'National Domestic Violence Hotline',
    detail: '1-800-799-7233 — call or text, 24/7',
    action: 'Call 1-800-799-7233',
    href: 'tel:18007997233',
  },
  {
    name: 'Emergency Services',
    detail: 'If you are in immediate danger',
    action: 'Call 911',
    href: 'tel:911',
  },
]

const SUPPORT_RESOURCES: ResourceItem[] = [
  {
    name: '211 Community Services',
    detail: 'Connects you to local food, housing, and support',
    action: 'Call or text 211',
    href: 'tel:211',
  },
]

export default function SafetyScreen({ flags, onContinue, onExit }: SafetyScreenProps) {
  const isEmergency = flags.some(f => f.safetyAction === 'emergency')
  const isUrgent = flags.some(f => f.safetyAction === 'urgent_care')
  const hasSafetyFlag = flags.some(f => f.domain === 'safety' || f.domain === 'mental_health')
  const hasMentalHealthFlag = flags.some(f => f.domain === 'mental_health' && f.flagLevel >= 3)
  const hasSocialSafetyFlag = flags.some(f => f.domain === 'social' && f.flagLevel >= 4)

  const resources = hasMentalHealthFlag
    ? CRISIS_RESOURCES
    : hasSocialSafetyFlag
    ? SAFETY_RESOURCES
    : SUPPORT_RESOURCES

  const patientMessages = flags
    .filter(f => f.patientMessage)
    .map(f => f.patientMessage!)
    .filter((msg, i, arr) => arr.indexOf(msg) === i)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1a4332] text-white">
      <div className="flex-1 overflow-y-auto px-6 py-10">
        <div className="mx-auto max-w-lg">
          {/* Header */}
          <div className="mb-8">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20"
              aria-hidden="true"
            >
              {isEmergency ? (
                <span className="text-2xl">🚨</span>
              ) : isUrgent ? (
                <span className="text-2xl">⚠️</span>
              ) : (
                <span className="text-2xl">💚</span>
              )}
            </div>
            <h1 className="font-display text-3xl font-semibold">
              {isEmergency
                ? 'Please reach out now'
                : isUrgent
                ? 'Support is available'
                : 'We noticed something important'}
            </h1>
          </div>

          {/* Patient messages from flags */}
          {patientMessages.length > 0 && (
            <div className="mb-6 space-y-3">
              {patientMessages.map((msg, i) => (
                <p key={i} className="rounded-2xl bg-white/10 px-5 py-4 text-base leading-relaxed">
                  {msg}
                </p>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <p className="mb-6 text-sm leading-relaxed text-white/70">
            This app does not provide diagnosis, treatment, or emergency care. If you are in
            immediate danger or medical crisis, call 911 or go to your nearest emergency room.
          </p>

          {/* Resources */}
          <div className="mb-8 space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
              Resources
            </p>
            {resources.map(r => (
              <a
                key={r.href}
                href={r.href}
                className="flex items-center justify-between rounded-2xl bg-white/10 px-5 py-4 text-left transition hover:bg-white/20"
              >
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="mt-0.5 text-sm text-white/70">{r.detail}</p>
                </div>
                <span className="ml-4 shrink-0 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-semibold">
                  {r.action}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-white/10 px-6 py-6">
        <div className="mx-auto max-w-lg space-y-3">
          {!isEmergency && (
            <button
              type="button"
              onClick={onContinue}
              className="w-full rounded-2xl bg-white px-5 py-4 text-base font-semibold text-[#1a4332] transition hover:bg-white/90"
            >
              Continue check-in
            </button>
          )}
          <button
            type="button"
            onClick={onExit}
            className="w-full rounded-2xl bg-white/10 px-5 py-4 text-base font-semibold text-white transition hover:bg-white/20"
          >
            End check-in
          </button>
        </div>
      </div>
    </div>
  )
}
