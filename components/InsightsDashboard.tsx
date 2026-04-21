'use client'

import { useEffect, useState } from 'react'
import DailySummaryRadarChart from '@/components/DailySummaryRadarChart'
import SelectChevron from '@/components/SelectChevron'
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
const RANGE_OPTIONS: RangeKey[] = ['weekly', 'monthly', 'yearly']

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
    <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-[0_20px_70px_rgba(76,149,108,0.14)]">
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
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 text-center shadow-[0_24px_80px_rgba(76,149,108,0.2)]">
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
        <section className="rounded-[2.4rem] border border-stone-200 bg-white p-6 shadow-[0_28px_90px_rgba(76,149,108,0.2)] sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2c6e49]">
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
                <span className="font-display text-5xl leading-none sm:text-8xl">
                  {latestSummary.total_score}
                </span>
                <span className="pb-1 text-base font-semibold text-stone-500 sm:pb-2 sm:text-lg">
                  /100
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-stone-500">
                Latest snapshot for {formatLongDate(latestDate)}
              </p>
            </div>

            <div className="w-full max-w-sm border-t border-[#e5e5e5] pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2c6e49]">
                Readout
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Higher scores mean your factors are trending steadier across mood, routine,
                symptoms, and support.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 border-t border-[#e5e5e5] pt-6 sm:grid-cols-2">
            <div className="pr-2">
              <p className="text-sm text-stone-500">Strongest factor</p>
              <p className="font-display mt-3 text-3xl text-stone-900">{strongestFactor.label}</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                {latestSummary.factor_scores[strongestFactor.key]}/100 on the latest view.
              </p>
            </div>
            <div className="pr-2 sm:border-l sm:border-[#e5e5e5] sm:pl-6">
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
        />
      </div>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_24px_80px_rgba(76,149,108,0.2)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#4c956c]">
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

          <div className="relative w-full sm:hidden">
            <label htmlFor="insights-range-select" className="sr-only">
              Choose an insight range
            </label>
            <select
              id="insights-range-select"
              value={range}
              onChange={(event) => setRange(event.target.value as RangeKey)}
              className="w-full appearance-none rounded-[1.2rem] border border-stone-200 bg-[#f0f0f0] px-4 py-3 pr-11 text-sm font-semibold capitalize text-stone-700 outline-none"
            >
              {RANGE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-stone-500">
              <SelectChevron />
            </span>
          </div>

          <div className="hidden flex-wrap gap-2 rounded-full bg-[#f0f0f0] p-1 sm:flex">
            {RANGE_OPTIONS.map((item) => {
              const active = range === item

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRange(item)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                    active ? 'bg-[linear-gradient(180deg,#56a86e_0%,#4c956c_100%)] text-white' : 'text-stone-600'
                  }`}
                >
                  {item}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
          <button
            type="button"
            onClick={() => toggleSeries('total')}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
              activeSeries.includes('total')
                ? 'bg-[#2c6e49] text-white'
                : 'border border-[#e5e5e5] bg-white text-stone-600'
            }`}
          >
            Total
          </button>

          {FACTOR_CONFIG.map((factor) => (
            <button
              key={factor.key}
              type="button"
              onClick={() => toggleSeries(factor.key)}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                activeSeries.includes(factor.key)
                  ? 'text-white'
                  : 'border border-[#e5e5e5] bg-white text-stone-600'
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
