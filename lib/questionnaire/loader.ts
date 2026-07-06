import type { CheckInTier, Question, QuestionTiming } from './types'
import { ALL_QUESTIONS } from './questions'
import { FOLLOW_UP_QUESTIONS } from './follow-ups'

const TIER_KEY = 'holistiq-checkin-tier'

// ── Tier persistence (localStorage) ─────────────────────────────────────────

export function getTier(): CheckInTier {
  if (typeof window === 'undefined') return 'beginner'
  const stored = localStorage.getItem(TIER_KEY)
  if (stored === 'intermediate' || stored === 'advanced') return stored
  return 'beginner'
}

export function setTier(tier: CheckInTier): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TIER_KEY, tier)
}

// ── Question loading ─────────────────────────────────────────────────────────

export function getQuestionsForSession(
  tier: CheckInTier,
  timing: Exclude<QuestionTiming, 'triggered'>,
): Question[] {
  return ALL_QUESTIONS.filter(q => q.tier === tier && q.timing === timing)
}

export function getFollowUpQuestion(id: string): Question | undefined {
  return FOLLOW_UP_QUESTIONS.find(q => q.id === id)
}

// ── Adapter: Question[] → the shape CheckInExperience expects ────────────────

export interface QuestionDefinitionCompat {
  id: string
  text: string
  examples?: string[]
  type: 'single' | 'multiple' | 'scale' | 'text'
  options?: Array<{ id: string; label: string; score: number | null; flagLevel?: number }>
  required?: boolean
  maxSelect?: number
}

export function toCompatQuestion(q: Question): QuestionDefinitionCompat {
  const typeMap: Record<Question['responseType'], QuestionDefinitionCompat['type']> = {
    single_choice: 'single',
    multi_choice: 'multiple',
    scale: 'scale',
    text_optional: 'text',
  }
  return {
    id: q.id,
    text: q.text,
    examples: q.examples,
    type: typeMap[q.responseType],
    options: q.options.map(o => ({
      id: o.id,
      label: o.label,
      score: o.score,
      flagLevel: o.flagLevel,
    })),
    required: q.required,
    maxSelect: q.maxSelect,
  }
}
