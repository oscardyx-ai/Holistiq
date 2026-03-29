'use client'

import { DailyEntry, ENERGY_LABELS, STRESS_LABELS, formatLongDate } from '@/components/checkInData'

interface JournalPageProps {
  entries: Record<string, DailyEntry>
  selectedDate: string
  onSelectDate: (date: string) => void
}

function MetricCard({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'accent'
}) {
  return (
    <article
      className={`rounded-[1.5rem] border p-4 ${
        tone === 'accent'
          ? 'border-emerald-200 bg-emerald-50/80'
          : 'border-stone-200 bg-white/90'
      }`}
    >
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-stone-900">{value}</p>
    </article>
  )
}

export default function JournalPage({
  entries,
  selectedDate,
  onSelectDate,
}: JournalPageProps) {
  const sortedDates = Object.keys(entries).sort((a, b) => b.localeCompare(a))
  const selectedEntry = entries[selectedDate] ?? entries[sortedDates[0]]

  if (!selectedEntry) {
    return (
      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_rgba(190,198,189,0.35)] backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-400">Journal</p>
        <h2 className="mt-4 text-2xl font-semibold text-stone-900">No entries yet</h2>
        <p className="mt-3 max-w-lg text-stone-500">
          Complete today&apos;s check-in to start building a day-by-day health journal.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(190,198,189,0.35)] backdrop-blur-xl sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-400">Journal</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900">
              {formatLongDate(selectedEntry.date)}
            </h2>
            <p className="mt-2 text-stone-500">
              A calm snapshot of how the day felt across sleep, energy, stress, activity,
              medication, and pain.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Feeling"
            value={['', 'Rough', 'Low', 'Okay', 'Good'][selectedEntry.feeling]}
            tone="accent"
          />
          <MetricCard label="Energy" value={ENERGY_LABELS[selectedEntry.energy - 1]} />
          <MetricCard label="Sleep" value={selectedEntry.sleep} />
          <MetricCard label="Stress" value={STRESS_LABELS[selectedEntry.stress - 1]} />
          <MetricCard label="Activity" value={selectedEntry.activity} />
          <MetricCard label="Medication" value={selectedEntry.medication} />
          {selectedEntry.painLevel !== null ? (
            <MetricCard label="Pain level" value={`${selectedEntry.painLevel}/10`} />
          ) : null}
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(190,198,189,0.25)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-stone-900">Recent check-ins</p>
            <p className="text-sm text-stone-500">Select a saved day to review it.</p>
          </div>
          <div className="rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-500">
            {sortedDates.length} saved {sortedDates.length === 1 ? 'entry' : 'entries'}
          </div>
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
          {sortedDates.map((date) => {
            const entry = entries[date]
            const isSelected = selectedEntry.date === date

            return (
              <button
                key={date}
                type="button"
                onClick={() => onSelectDate(date)}
                className={`min-w-40 rounded-[1.35rem] border px-4 py-4 text-left transition-all ${
                  isSelected
                    ? 'border-stone-900 bg-stone-900 text-white shadow-lg shadow-stone-900/10'
                    : 'border-stone-200 bg-white text-stone-700 hover:-translate-y-0.5 hover:border-stone-300'
                }`}
              >
                <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-stone-400'}`}>
                  {formatLongDate(date)}
                </p>
                <p className="mt-3 text-sm font-semibold">
                  Feeling {['', 'rough', 'low', 'okay', 'good'][entry.feeling]}
                </p>
                <p className={`mt-1 text-xs ${isSelected ? 'text-white/70' : 'text-stone-500'}`}>
                  Energy {ENERGY_LABELS[entry.energy - 1].toLowerCase()}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
