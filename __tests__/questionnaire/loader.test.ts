import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getQuestionsForSession, getFollowUpQuestion } from '../../lib/questionnaire/loader'
import { ALL_QUESTIONS } from '../../lib/questionnaire/questions'
import { FOLLOW_UP_QUESTIONS } from '../../lib/questionnaire/follow-ups'

describe('getQuestionsForSession', () => {
  it('returns beginner morning questions', () => {
    const qs = getQuestionsForSession('beginner', 'morning')
    expect(qs.length).toBeGreaterThan(0)
    expect(qs.every(q => q.tier === 'beginner' && q.timing === 'morning')).toBe(true)
  })

  it('returns intermediate night questions', () => {
    const qs = getQuestionsForSession('intermediate', 'night')
    expect(qs.length).toBeGreaterThan(0)
    expect(qs.every(q => q.tier === 'intermediate' && q.timing === 'night')).toBe(true)
  })

  it('returns advanced weekly questions', () => {
    const qs = getQuestionsForSession('advanced', 'weekly')
    expect(qs.length).toBeGreaterThan(0)
    expect(qs.every(q => q.tier === 'advanced' && q.timing === 'weekly')).toBe(true)
  })

  it('beginner has more questions at intermediate tier', () => {
    const beginner = getQuestionsForSession('beginner', 'morning')
    const intermediate = getQuestionsForSession('intermediate', 'morning')
    expect(intermediate.length).toBeGreaterThan(beginner.length)
  })

  it('intermediate has fewer questions than advanced', () => {
    const intermediate = getQuestionsForSession('intermediate', 'weekly')
    const advanced = getQuestionsForSession('advanced', 'weekly')
    expect(advanced.length).toBeGreaterThan(intermediate.length)
  })

  it('all question IDs are unique within a session', () => {
    for (const tier of ['beginner', 'intermediate', 'advanced'] as const) {
      for (const timing of ['morning', 'night', 'weekly'] as const) {
        const qs = getQuestionsForSession(tier, timing)
        const ids = qs.map(q => q.id)
        expect(ids.length).toBe(new Set(ids).size)
      }
    }
  })

  it('all questions have at least two options', () => {
    const nonText = ALL_QUESTIONS.filter(q => q.responseType !== 'text_optional')
    expect(nonText.every(q => q.options.length >= 2)).toBe(true)
  })

  it('all question options have non-empty ids and labels', () => {
    for (const q of ALL_QUESTIONS) {
      for (const opt of q.options) {
        expect(opt.id.length).toBeGreaterThan(0)
        expect(opt.label.length).toBeGreaterThan(0)
      }
    }
  })

  it('score is 0–4 or null for all options', () => {
    for (const q of ALL_QUESTIONS) {
      for (const opt of q.options) {
        if (opt.score !== null) {
          expect(opt.score).toBeGreaterThanOrEqual(0)
          expect(opt.score).toBeLessThanOrEqual(4)
        }
      }
    }
  })

  it('flagLevel 0–4 or absent for all options', () => {
    for (const q of ALL_QUESTIONS) {
      for (const opt of q.options) {
        if (opt.flagLevel !== undefined) {
          expect(opt.flagLevel).toBeGreaterThanOrEqual(0)
          expect(opt.flagLevel).toBeLessThanOrEqual(4)
        }
      }
    }
  })
})

describe('getFollowUpQuestion', () => {
  it('returns a follow-up question by ID', () => {
    const q = getFollowUpQuestion('Q_FU_MH_1')
    expect(q).toBeDefined()
    expect(q?.followUpOnly).toBe(true)
  })

  it('returns undefined for unknown ID', () => {
    expect(getFollowUpQuestion('Q_NONEXISTENT')).toBeUndefined()
  })

  it('all follow-up questions are marked followUpOnly', () => {
    expect(FOLLOW_UP_QUESTIONS.every(q => q.followUpOnly === true)).toBe(true)
  })

  it('all follow-up question IDs are unique', () => {
    const ids = FOLLOW_UP_QUESTIONS.map(q => q.id)
    expect(ids.length).toBe(new Set(ids).size)
  })
})
