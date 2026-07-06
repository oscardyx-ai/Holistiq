'use client'

import type { CheckInTier } from '@/lib/questionnaire/types'

interface TierOption {
  value: CheckInTier
  label: string
  description: string
  detail: string
  questions: string
}

const TIERS: TierOption[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Short and simple',
    detail: 'A few quick questions about your core health areas. Best if you are new to check-ins or want something low-effort.',
    questions: '5–8 questions per check-in',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'More detail',
    detail: 'Covers more health areas with slightly more questions. Good for people managing a health condition day-to-day.',
    questions: '7–18 questions per check-in',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Full picture',
    detail: 'The most comprehensive option — detailed tracking across all health areas. Best for people who want deep insights.',
    questions: '14–29 questions per check-in',
  },
]

interface TierSelectorProps {
  value: CheckInTier
  onChange: (tier: CheckInTier) => void
  layout?: 'cards' | 'compact'
}

export default function TierSelector({
  value,
  onChange,
  layout = 'cards',
}: TierSelectorProps) {
  if (layout === 'compact') {
    return (
      <div className="flex gap-2">
        {TIERS.map(tier => (
          <button
            key={tier.value}
            type="button"
            onClick={() => onChange(tier.value)}
            className={`flex-1 rounded-[1rem] border px-3 py-2.5 text-sm font-semibold transition ${
              value === tier.value
                ? 'border-[#4c956c] bg-[#e0f5ec] text-[#2c6e49]'
                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-800'
            }`}
          >
            {tier.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {TIERS.map(tier => {
        const selected = value === tier.value
        return (
          <button
            key={tier.value}
            type="button"
            onClick={() => onChange(tier.value)}
            className={`rounded-[1.6rem] border p-5 text-left transition ${
              selected
                ? 'border-[#4c956c] bg-[#e0f5ec]'
                : 'border-stone-100 bg-white hover:border-stone-200'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className={`text-base font-semibold ${
                  selected ? 'text-[#2c6e49]' : 'text-stone-900'
                }`}
              >
                {tier.label}
              </span>
              {selected && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4c956c]">
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
            </div>
            <p
              className={`text-sm font-medium ${
                selected ? 'text-[#2c6e49]' : 'text-stone-600'
              }`}
            >
              {tier.description}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">{tier.detail}</p>
            <p
              className={`mt-3 text-xs font-semibold ${
                selected ? 'text-[#4c956c]' : 'text-stone-400'
              }`}
            >
              {tier.questions}
            </p>
          </button>
        )
      })}
    </div>
  )
}
