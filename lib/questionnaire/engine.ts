import type {
  Question,
  TriggerRule,
  TrendRule,
  PatientFlag,
  FlagLevel,
  TriggerCondition,
  DomainKey,
} from './types'
import { TRIGGER_RULES } from './trigger-rules'
import { TREND_RULES } from './trend-rules'
import { ALL_QUESTIONS } from './questions'
import { FOLLOW_UP_QUESTIONS } from './follow-ups'

const ALL_Q_MAP = new Map<string, Question>(
  [...ALL_QUESTIONS, ...FOLLOW_UP_QUESTIONS].map(q => [q.id, q]),
)

// ── Condition evaluation ─────────────────────────────────────────────────────

function evalCondition(
  condition: TriggerCondition,
  answers: Record<string, string[]>,
): boolean {
  const selected = answers[condition.questionId]
  if (!selected || selected.length === 0) return false

  switch (condition.operator) {
    case 'equals':
      return selected.includes(String(condition.value))
    case 'in': {
      const values = condition.value as (string | number)[]
      return selected.some(s => values.map(String).includes(s))
    }
    case 'contains':
      return selected.includes(String(condition.value))
    case 'gte': {
      const score = getMaxScore(condition.questionId, selected)
      return score !== null && score >= Number(condition.value)
    }
    case 'lte': {
      const score = getMaxScore(condition.questionId, selected)
      return score !== null && score <= Number(condition.value)
    }
    default:
      return false
  }
}

function getMaxScore(questionId: string, selectedIds: string[]): number | null {
  const q = ALL_Q_MAP.get(questionId)
  if (!q) return null
  let max: number | null = null
  for (const id of selectedIds) {
    const opt = q.options.find(o => o.id === id)
    if (opt?.score != null && (max === null || opt.score > max)) max = opt.score
  }
  return max
}

// ── Trigger evaluation ───────────────────────────────────────────────────────

export interface TriggerResult {
  rule: TriggerRule
  flag: PatientFlag
  followUpQuestionIds: string[]
}

export function evaluateTriggers(
  answers: Record<string, string[]>,
  sessionId: string,
): TriggerResult[] {
  const results: TriggerResult[] = []

  for (const rule of TRIGGER_RULES) {
    if (!evalCondition(rule.condition, answers)) continue

    const flag: PatientFlag = {
      id: `${sessionId}_${rule.id}`,
      ruleId: rule.id,
      domain: rule.domain,
      flagLevel: rule.flagLevel,
      status: 'active',
      createdAt: new Date(),
      visibleToPatient: true,
      visibleToClinician: rule.notifyClinician,
      clinicianLabel: rule.clinicianFlagLabel,
      patientMessage: rule.patientMessage,
      safetyAction: rule.safetyAction,
    }

    results.push({ rule, flag, followUpQuestionIds: rule.followUpQuestionIds })
  }

  return results
}

// ── Trend evaluation ─────────────────────────────────────────────────────────

export interface CheckInHistory {
  completedAt: Date
  /** map of domain → highest spec score seen in that session */
  domainPeakScores: Partial<Record<DomainKey, number>>
}

export function evaluateTrends(
  history: CheckInHistory[],
  sessionId: string,
): PatientFlag[] {
  const flags: PatientFlag[] = []
  const now = new Date()

  for (const rule of TREND_RULES) {
    const windowStart = new Date(now.getTime() - rule.windowDays * 24 * 60 * 60 * 1000)
    const recentSessions = history.filter(h => h.completedAt >= windowStart)

    const qualifying = recentSessions.filter(h => {
      const peak = h.domainPeakScores[rule.domain]
      return peak != null && peak >= 3  // score ≥ 3 on spec scale = flag threshold
    })

    if (qualifying.length >= rule.minOccurrences) {
      flags.push({
        id: `${sessionId}_${rule.id}`,
        ruleId: rule.id,
        domain: rule.domain,
        flagLevel: rule.flagLevel,
        status: 'active',
        createdAt: new Date(),
        visibleToPatient: true,
        visibleToClinician: rule.notifyClinician,
        clinicianLabel: rule.clinicianFlagLabel,
        patientMessage: rule.patientMessage,
        safetyAction: rule.safetyAction,
      })
    }
  }

  return flags
}

// ── Safety determination ─────────────────────────────────────────────────────

export function requiresSafetyPause(flags: PatientFlag[]): boolean {
  return flags.some(f => f.flagLevel === 4)
}

export function highestSafetyAction(
  flags: PatientFlag[],
): 'none' | 'show_resources' | 'urgent_care' | 'emergency' {
  const priority: Record<string, number> = {
    none: 0,
    show_resources: 1,
    urgent_care: 2,
    emergency: 3,
  }
  return flags.reduce<'none' | 'show_resources' | 'urgent_care' | 'emergency'>(
    (best, f) => (priority[f.safetyAction] > priority[best] ? f.safetyAction : best),
    'none',
  )
}

// ── Peak score extraction (for history recording) ────────────────────────────

export function computeDomainPeakScores(
  answers: Record<string, string[]>,
  questions: Question[],
): Partial<Record<DomainKey, number>> {
  const peaks: Partial<Record<DomainKey, number>> = {}

  for (const q of questions) {
    const selected = answers[q.id]
    if (!selected) continue
    for (const id of selected) {
      const opt = q.options.find(o => o.id === id)
      if (opt?.score == null) continue
      const prev = peaks[q.domain] ?? 0
      if (opt.score > prev) peaks[q.domain] = opt.score
    }
  }

  return peaks
}
