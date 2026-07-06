import type { DomainKey } from './types'

export interface DomainScore {
  domain: DomainKey
  score: number        // 0–100, higher = better
  questionCount: number
}

/** Maps spec score 0–4 → factor score 0–100 (higher = healthier). */
export function specScoreToFactor(specScore: number): number {
  return Math.round((1 - specScore / 4) * 100)
}

/** Averages spec scores for a domain and converts to 0–100 factor. */
export function computeDomainScore(
  specScores: number[],
): number {
  if (specScores.length === 0) return 100
  const avg = specScores.reduce((a, b) => a + b, 0) / specScores.length
  return specScoreToFactor(avg)
}

/** Extracts numeric scores from a map of { questionId → answerId[] }. */
export function extractDomainScores(
  answers: Record<string, string[]>,
  questions: Array<{ id: string; domain: DomainKey; options: Array<{ id: string; score: number | null }> }>,
): DomainScore[] {
  const domainBuckets = new Map<DomainKey, number[]>()

  for (const question of questions) {
    const selectedIds = answers[question.id]
    if (!selectedIds || selectedIds.length === 0) continue

    for (const selectedId of selectedIds) {
      const opt = question.options.find(o => o.id === selectedId)
      if (!opt || opt.score === null) continue

      const bucket = domainBuckets.get(question.domain) ?? []
      bucket.push(opt.score)
      domainBuckets.set(question.domain, bucket)
    }
  }

  const result: DomainScore[] = []
  for (const [domain, specScores] of domainBuckets.entries()) {
    result.push({
      domain,
      score: computeDomainScore(specScores),
      questionCount: specScores.length,
    })
  }
  return result
}

/**
 * Maps new questionnaire domains to the existing FACTOR_CONFIG keys.
 * sleep and safety don't have direct factor keys — they map to lifestyle and environment.
 */
export const DOMAIN_TO_FACTOR: Partial<Record<DomainKey, string>> = {
  pain: 'pain',
  mental_health: 'mental_health',
  social: 'social',
  lifestyle: 'lifestyle',
  diet: 'diet',
  environment: 'environment',
  medication: 'medication',
  activity: 'activity',
  sleep: 'lifestyle',       // sleep rolls into lifestyle factor
  safety: 'environment',    // safety rolls into environment factor
}
