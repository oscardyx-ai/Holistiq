'use client'

import DailySummaryRadarChart, {
  type DailySummary,
} from '@/components/DailySummaryRadarChart'
import { DailyEntry, ENERGY_LABELS, STRESS_LABELS, formatShortDate } from '@/components/checkInData'

interface MoodGridProps {
  entries: Record<string, DailyEntry>
}

function average(values: number[]) {
  if (!values.length) {
    return 0
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

function moodTone(score: number) {
  if (score >= 4) return 'bg-emerald-300'
  if (score >= 3) return 'bg-amber-200'
  if (score >= 2) return 'bg-rose-200'
  return 'bg-rose-300'
}

function toTenPointScore(value: number, max: number) {
  return Math.round((value / max) * 10)
}

function sleepScore(value: DailyEntry['sleep']) {
  if (value === 'Good') return 8
  if (value === 'Okay') return 5
  return 2
}

function buildDailySummary(entry: DailyEntry): DailySummary {
  return {
    date: entry.date,
    scores: {
      mood: toTenPointScore(entry.feeling, 4),
      energy: toTenPointScore(entry.energy, 5),
      sleep: sleepScore(entry.sleep),
      stress: toTenPointScore(entry.stress, 5),
      pain: entry.painLevel ?? 0,
      appetite: 0,
      activity: toTenPointScore(ACTIVITY_SCORE_MAP[entry.activity], 5),
      social: 0,
    },
  }
}

const ACTIVITY_SCORE_MAP: Record<DailyEntry['activity'], number> = {
  Sedentary: 1,
  'Not very': 2,
  Light: 3,
  Moderate: 4,
  'Very active': 5,
}

function InsightCard({
  label,
  value,
  caption,
}: {
  label: string
  value: string
  caption: string
}) {
  return (
    <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-stone-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-stone-500">{caption}</p>
    </article>
  )
}

export default function MoodGrid({ entries }: MoodGridProps) {
  const allEntries = Object.values(entries).sort((a, b) => a.date.localeCompare(b.date))

  if (!allEntries.length) {
    return (
      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_rgba(190,198,189,0.35)] backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-400">Summary</p>
        <h2 className="mt-4 text-2xl font-semibold text-stone-900">No trends yet</h2>
        <p className="mt-3 max-w-lg text-stone-500">
          Once check-ins are saved, this view will highlight patterns across mood, stress,
          sleep, and activity.
        </p>
      </section>
    )
  }

  const averageFeeling = average(allEntries.map((entry) => entry.feeling))
  const averageStress = average(allEntries.map((entry) => entry.stress))
  const averageEnergy = average(allEntries.map((entry) => entry.energy))
  const medicationTakenDays = allEntries.filter((entry) => entry.medication === 'Yes').length
  const bestEnergyDay = [...allEntries].sort((a, b) => b.energy - a.energy)[0]
  const latestSummary = buildDailySummary(allEntries.at(-1)!)

  return (
    <section className="space-y-6">
      <DailySummaryRadarChart summary={latestSummary} />

      <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(190,198,189,0.35)] backdrop-blur-xl sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-400">Summary</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900">Daily trends at a glance</h2>
            <p className="mt-2 max-w-2xl text-stone-500">
              This view turns each saved check-in into quick signals that are easier to review
              over time.
            </p>
          </div>
          <div className="rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-500">
            {allEntries.length} total {allEntries.length === 1 ? 'check-in' : 'check-ins'}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InsightCard
            label="Average feeling"
            value={averageFeeling.toFixed(1)}
            caption="A simple mood average based on the daily feeling question."
          />
          <InsightCard
            label="Average energy"
            value={averageEnergy.toFixed(1)}
            caption={`Most recent energy label: ${ENERGY_LABELS[allEntries.at(-1)!.energy - 1]}.`}
          />
          <InsightCard
            label="Average stress"
            value={averageStress.toFixed(1)}
            caption={`Most recent stress label: ${STRESS_LABELS[allEntries.at(-1)!.stress - 1]}.`}
          />
          <InsightCard
            label="Medication taken"
            value={`${medicationTakenDays}/${allEntries.length}`}
            caption="Counts the number of days marked yes for medication adherence."
          />
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(190,198,189,0.25)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-stone-900">Mood timeline</p>
            <p className="text-sm text-stone-500">Each tile represents a saved day.</p>
          </div>
          <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-500">
            Best energy day: {formatShortDate(bestEnergyDay.date)}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {allEntries.map((entry) => (
            <article
              key={entry.date}
              className="rounded-[1.35rem] border border-stone-200 bg-white p-4"
            >
              <div className={`h-2 rounded-full ${moodTone(entry.feeling)}`} />
              <p className="mt-4 text-sm font-semibold text-stone-900">
                {formatShortDate(entry.date)}
              </p>
              <dl className="mt-3 space-y-2 text-sm text-stone-500">
                <div className="flex items-center justify-between gap-3">
                  <dt>Feeling</dt>
                  <dd>{entry.feeling}/4</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Energy</dt>
                  <dd>{entry.energy}/5</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Stress</dt>
                  <dd>{entry.stress}/5</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Sleep</dt>
                  <dd>{entry.sleep}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
