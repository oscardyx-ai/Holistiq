'use client'

import { useEffect, useState } from 'react'
import DailySummaryRadarChart from '@/components/DailySummaryRadarChart'
import TrendLineChart from '@/components/TrendLineChart'
import {
  FACTOR_CONFIG,
  FactorKey,
  formatLongDate,
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
    <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-[0_20px_70px_rgba(190,198,189,0.14)]">
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
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 text-center shadow-[0_24px_80px_rgba(190,198,189,0.2)]">
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

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[2.4rem] border border-stone-200 bg-white p-6 shadow-[0_28px_90px_rgba(190,198,189,0.2)] sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#5c7d49]">
            Daily summary
          </p>
          <h2 className="font-display mt-3 text-4xl leading-tight text-stone-900 sm:text-5xl">
            Overall wellbeing
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
            Your latest score blends daily check-in answers with any connected app signals into a
            single 0-100 snapshot.
          </p>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-end gap-3 text-stone-900">
                <span className="font-display text-7xl leading-none sm:text-8xl">
                  {latestSummary.total_score}
                </span>
                <span className="pb-2 text-lg font-semibold text-stone-500">/100</span>
              </div>
              <p className="mt-3 text-sm font-medium text-stone-500">
                Latest snapshot for {formatLongDate(latestDate)}
              </p>
            </div>

            <div className="max-w-sm border-l border-[#ddd3c2] pl-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5c7d49]">
                Readout
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Higher scores mean your factors are trending steadier across mood, routine,
                symptoms, and support.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 border-t border-[#ddd3c2] pt-6 sm:grid-cols-2">
            <div className="pr-2">
              <p className="text-sm text-stone-500">Strongest factor</p>
              <p className="font-display mt-3 text-3xl text-stone-900">{strongestFactor.label}</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                {latestSummary.factor_scores[strongestFactor.key]}/100 on the latest view.
              </p>
            </div>
            <div className="pr-2 sm:border-l sm:border-[#ddd3c2] sm:pl-6">
              <p className="text-sm text-stone-500">Most fragile factor</p>
              <p className="font-display mt-3 text-3xl text-stone-900">{lowestFactor.label}</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                {latestSummary.factor_scores[lowestFactor.key]}/100 on the latest view.
              </p>
            </div>
          </div>
        </section>

        <DailySummaryRadarChart
          date={latestDate}
          factorScores={latestSummary.factor_scores}
          className="h-full"
          height={360}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatCard
          label="Scoring model"
          value="Blended score"
          caption="Each summary combines the latest question-based factor scores with connected app signals before producing the daily total."
        />
        <StatCard
          label="Latest scoring window"
          value={formatLongDate(latestDate)}
          caption="This view uses the most recent day with enough check-in and connected app data to calculate the summary."
        />
      </div>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_24px_80px_rgba(190,198,189,0.2)]">
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
