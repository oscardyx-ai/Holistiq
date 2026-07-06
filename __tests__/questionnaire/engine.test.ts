import { describe, it, expect } from 'vitest'
import {
  evaluateTriggers,
  evaluateTrends,
  requiresSafetyPause,
  highestSafetyAction,
  computeDomainPeakScores,
} from '../../lib/questionnaire/engine'
import { computeDomainScore, extractDomainScores, specScoreToFactor } from '../../lib/questionnaire/scoring'
import { ALL_QUESTIONS } from '../../lib/questionnaire/questions'
import type { CheckInHistory } from '../../lib/questionnaire/engine'

// ── Scoring ────────────────────────────────────────────────────────────────────

describe('specScoreToFactor', () => {
  it('maps spec score 0 to factor 100', () => {
    expect(specScoreToFactor(0)).toBe(100)
  })
  it('maps spec score 4 to factor 0', () => {
    expect(specScoreToFactor(4)).toBe(0)
  })
  it('maps spec score 2 to factor 50', () => {
    expect(specScoreToFactor(2)).toBe(50)
  })
})

describe('computeDomainScore', () => {
  it('returns 100 for empty array', () => {
    expect(computeDomainScore([])).toBe(100)
  })
  it('averages scores then converts', () => {
    // avg of [0, 4] = 2 → factor 50
    expect(computeDomainScore([0, 4])).toBe(50)
  })
})

describe('extractDomainScores', () => {
  it('extracts pain scores from beginner morning answers', () => {
    const morningQs = ALL_QUESTIONS.filter(q => q.tier === 'beginner' && q.timing === 'morning')
    const answers: Record<string, string[]> = { 'Q_B_M_1': ['severe_pain'] }
    const scores = extractDomainScores(answers, morningQs)
    const pain = scores.find(s => s.domain === 'pain')
    expect(pain).toBeDefined()
    expect(pain!.score).toBeLessThan(50)  // severe pain → low factor score
  })

  it('ignores null scores (prefer_not_answer)', () => {
    const qs = ALL_QUESTIONS.filter(q => q.tier === 'beginner' && q.timing === 'night')
    const answers: Record<string, string[]> = { 'Q_B_N_4': ['prefer_not_answer'] }
    const scores = extractDomainScores(answers, qs)
    expect(scores.length).toBe(0)
  })
})

// ── Triggers ──────────────────────────────────────────────────────────────────

describe('evaluateTriggers', () => {
  it('fires TR_MH_3 when thoughts_with_plan is selected', () => {
    const answers = { 'Q_FU_MH_1': ['thoughts_with_plan'] }
    const results = evaluateTriggers(answers, 'test_session')
    const emergency = results.find(r => r.rule.id === 'TR_MH_3')
    expect(emergency).toBeDefined()
    expect(emergency!.flag.safetyAction).toBe('emergency')
    expect(emergency!.flag.flagLevel).toBe(4)
  })

  it('fires TR_MH_2 for any self-harm thought', () => {
    const answers = { 'Q_FU_MH_1': ['brief_passing_thought'] }
    const results = evaluateTriggers(answers, 'test_session')
    const urgent = results.find(r => r.rule.id === 'TR_MH_2')
    expect(urgent).toBeDefined()
  })

  it('fires TR_P_3 for chest pain', () => {
    const answers = { 'Q_FU_P_1': ['chest'] }
    const results = evaluateTriggers(answers, 'test_session')
    const chest = results.find(r => r.rule.id === 'TR_P_3')
    expect(chest).toBeDefined()
    expect(chest!.flag.flagLevel).toBe(4)
  })

  it('fires TR_S_2 for confirmed unsafe location', () => {
    const answers = { 'Q_FU_S_2': ['no'] }
    const results = evaluateTriggers(answers, 'test_session')
    const unsafe = results.find(r => r.rule.id === 'TR_S_2')
    expect(unsafe).toBeDefined()
    expect(unsafe!.flag.safetyAction).toBe('emergency')
  })

  it('returns empty array when no rules match', () => {
    const answers = { 'Q_B_M_1': ['no_pain'] }
    const results = evaluateTriggers(answers, 'test_session')
    expect(results.length).toBe(0)
  })

  it('provides follow-up question IDs for triggerable rules', () => {
    const answers = { 'Q_I_N_3': ['very_severe'] }
    const results = evaluateTriggers(answers, 'test_session')
    const mhRule = results.find(r => r.rule.id === 'TR_MH_1')
    expect(mhRule).toBeDefined()
    expect(mhRule!.followUpQuestionIds.length).toBeGreaterThan(0)
  })
})

// ── Safety ─────────────────────────────────────────────────────────────────────

describe('requiresSafetyPause', () => {
  it('returns true when any flag has level 4', () => {
    const flags = evaluateTriggers({ 'Q_FU_MH_1': ['thoughts_with_plan'] }, 's').map(r => r.flag)
    expect(requiresSafetyPause(flags)).toBe(true)
  })

  it('returns false when no flags have level 4', () => {
    expect(requiresSafetyPause([])).toBe(false)
  })
})

describe('highestSafetyAction', () => {
  it('returns emergency over urgent_care', () => {
    const flags = [
      ...evaluateTriggers({ 'Q_FU_MH_1': ['thoughts_with_plan'] }, 's').map(r => r.flag),
      ...evaluateTriggers({ 'Q_I_N_3': ['very_severe'] }, 's').map(r => r.flag),
    ]
    const action = highestSafetyAction(flags)
    expect(action).toBe('emergency')
  })

  it('returns none for empty flags', () => {
    expect(highestSafetyAction([])).toBe('none')
  })
})

// ── Trends ─────────────────────────────────────────────────────────────────────

describe('evaluateTrends', () => {
  it('triggers TREND_P_1 when pain score ≥ 3 in 3+ sessions within 7 days', () => {
    const now = new Date()
    const history: CheckInHistory[] = [1, 2, 3].map(daysAgo => ({
      completedAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
      domainPeakScores: { pain: 3 },
    }))

    const flags = evaluateTrends(history, 'trend_test')
    const painTrend = flags.find(f => f.ruleId === 'TREND_P_1')
    expect(painTrend).toBeDefined()
    expect(painTrend!.flagLevel).toBe(3)
  })

  it('does not trigger trend when occurrences are below threshold', () => {
    const now = new Date()
    const history: CheckInHistory[] = [1, 2].map(daysAgo => ({
      completedAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
      domainPeakScores: { pain: 3 },
    }))

    const flags = evaluateTrends(history, 'trend_test')
    const painTrend = flags.find(f => f.ruleId === 'TREND_P_1')
    expect(painTrend).toBeUndefined()
  })

  it('does not count sessions outside the window', () => {
    const now = new Date()
    // 3 sessions but 2 are outside the 7-day window
    const history: CheckInHistory[] = [
      { completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), domainPeakScores: { pain: 3 } },
      { completedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), domainPeakScores: { pain: 3 } },
      { completedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), domainPeakScores: { pain: 3 } },
    ]

    const flags = evaluateTrends(history, 'trend_test')
    const painTrend = flags.find(f => f.ruleId === 'TREND_P_1')
    expect(painTrend).toBeUndefined()
  })

  it('returns all matching trend rules', () => {
    const now = new Date()
    const history: CheckInHistory[] = [1, 2, 3, 4].map(daysAgo => ({
      completedAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
      domainPeakScores: { pain: 3, mental_health: 3 },
    }))

    const flags = evaluateTrends(history, 'trend_test')
    const ruleIds = flags.map(f => f.ruleId)
    expect(ruleIds).toContain('TREND_P_1')
    expect(ruleIds).toContain('TREND_MH_1')
  })
})

// ── computeDomainPeakScores ────────────────────────────────────────────────────

describe('computeDomainPeakScores', () => {
  it('returns the highest spec score per domain', () => {
    const qs = ALL_QUESTIONS.filter(q => q.tier === 'beginner' && q.timing === 'morning')
    const answers = {
      'Q_B_M_1': ['severe_pain'],   // score 3
    }
    const peaks = computeDomainPeakScores(answers, qs)
    expect(peaks.pain).toBe(3)
  })

  it('ignores null scores', () => {
    const qs = ALL_QUESTIONS.filter(q => q.id === 'Q_B_N_4')
    const answers = { 'Q_B_N_4': ['prefer_not_answer'] }
    const peaks = computeDomainPeakScores(answers, qs)
    expect(peaks.lifestyle).toBeUndefined()
  })
})
