'use client'

import { useEffect, useState } from 'react'
import DailySummaryRadarChart from '@/components/DailySummaryRadarChart'
import TrendLineChart from '@/components/TrendLineChart'
import {
  FACTOR_CONFIG,
  FactorKey,
  getLatestAvailableDate,
  WellnessState,
} from '@/components/checkInData'
import { fetchDailySummary, fetchTrendPoints } from '@/lib/wellness-api'

type RangeKey = 'weekly' | 'monthly' | 'yearly'

function StatCard({
  label,
  value,
  caption,
}: {
  label: string
  value: string
  caption: string
}) {
  return (
    <article className="rounded-[1.5rem] border border-[#ece3d4] bg-white/88 p-5">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="font-display mt-3 text-3xl text-stone-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-stone-500">{caption}</p>
    </article>
  )
}

export default function InsightsDashboard({ state }: { state: WellnessState }) {
  const latestDate = getLatestAvailableDate(state.sessions, state.connectedApps)
  const [range, setRange] = useState<RangeKey>('weekly')
  const [activeSeries, setActiveSeries] = useState<Array<FactorKey | 'total'>>([
    'total',
    ...FACTOR_CONFIG.map((factor) => factor.key),
  ])
  const [latestSummary, setLatestSummary] = useState<{
    factor_scores: Record<string, number>
    total_score: number
  } | null>(null)
  const [trendPoints, setTrendPoints] = useState<
    Array<{
      label: string
      period_key: string
      factor_scores: Record<string, number>
      total_score: number
    }>
  >([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadSummary() {
      try {
        const summary = await fetchDailySummary(latestDate)
        if (!cancelled) {
          setLatestSummary(summary)
        }
      } catch {
        if (!cancelled) {
          setError('Could not load insight summaries right now.')
        }
      }
    }

    void loadSummary()

    return () => {
      cancelled = true
    }
  }, [latestDate])

  useEffect(() => {
    let cancelled = false

    async function loadTrends() {
      try {
        const response = await fetchTrendPoints(range)
        if (!cancelled) {
          setTrendPoints(response.points)
        }
      } catch {
        if (!cancelled) {
          setError('Could not load insight trends right now.')
        }
      }
    }

    void loadTrends()

    return () => {
      cancelled = true
    }
  }, [range])

  if (!latestSummary) {
    return (
      <section className="rounded-[2rem] border border-white/70 bg-white/88 p-6 text-center shadow-[0_24px_80px_rgba(190,198,189,0.2)] backdrop-blur-xl">
        <h2 className="font-display text-3xl text-stone-900">Loading insights</h2>
        <p className="mt-3 text-sm text-stone-500">Running backend scoring and trend aggregation for your latest data.</p>
      </section>
    )
  }

  const strongestFactor = FACTOR_CONFIG.slice().sort(
    (a, b) => latestSummary.factor_scores[b.key] - latestSummary.factor_scores[a.key]
  )[0]
  const lowestFactor = FACTOR_CONFIG.slice().sort(
    (a, b) => latestSummary.factor_scores[a.key] - latestSummary.factor_scores[b.key]
  )[0]

  function toggleSeries(seriesKey: FactorKey | 'total') {
    setActiveSeries((current) =>
      current.includes(seriesKey)
        ? current.filter((item) => item !== seriesKey)
        : [...current, seriesKey]
    )
  }

  return (
    <section className="space-y-6">
      {error ? (
        <div className="rounded-[1.4rem] border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <DailySummaryRadarChart date={latestDate} factorScores={latestSummary.factor_scores} />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Overall wellbeing"
          value={`${latestSummary.total_score}`}
          caption="Average of all factor scores after question answers and connected app signals are blended together."
        />
        <StatCard
          label="Strongest factor"
          value={strongestFactor.label}
          caption={`${latestSummary.factor_scores[strongestFactor.key]}/100 on the latest view.`}
        />
        <StatCard
          label="Most fragile factor"
          value={lowestFactor.label}
          caption={`${latestSummary.factor_scores[lowestFactor.key]}/100 on the latest view.`}
        />
      </div>

      <section className="rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-[0_24px_80px_rgba(190,198,189,0.2)] backdrop-blur-xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6f8e58]">
              Trends
            </p>
            <h2 className="font-display mt-3 text-3xl text-stone-900">
              Weekly, monthly, and yearly lines
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
              Each factor can be toggled on or off. The total line is the average of all factor
              scores for each time bucket.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 rounded-full bg-[#f3eddf] p-1">
            {(['weekly', 'monthly', 'yearly'] as RangeKey[]).map((item) => {
              const active = range === item

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRange(item)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                    active ? 'bg-[#6f9658] text-white' : 'text-stone-600'
                  }`}
                >
                  {item}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toggleSeries('total')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeSeries.includes('total')
                ? 'bg-[#1f3c25] text-white'
                : 'border border-[#ddd3c2] bg-white text-stone-600'
            }`}
          >
            Total
          </button>

          {FACTOR_CONFIG.map((factor) => (
            <button
              key={factor.key}
              type="button"
              onClick={() => toggleSeries(factor.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeSeries.includes(factor.key)
                  ? 'text-white'
                  : 'border border-[#ddd3c2] bg-white text-stone-600'
              }`}
              style={{
                backgroundColor: activeSeries.includes(factor.key) ? factor.color : undefined,
              }}
            >
              {factor.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <TrendLineChart
            points={trendPoints.map((point) => ({
              label: point.label,
              periodKey: point.period_key,
              factorScores: point.factor_scores as Record<FactorKey, number>,
              totalScore: point.total_score,
            }))}
            activeSeries={activeSeries}
          />
        </div>
      </section>

    </section>
  )
}
