'use client'

import { useState } from 'react'

interface DayEntry {
  mood: number
  stress: number
  exercise: number
  medication: boolean
}

function makeDefault(moodScore?: number): DayEntry {
  return { mood: moodScore ?? 0, stress: 0, exercise: 0, medication: false }
}

function formatDate(offset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function ScoreRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/10">
      <span className="text-gray-400 text-sm">{label}</span>
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1)}
            className={`w-6 h-6 rounded-full transition-colors ${
              i < value ? 'bg-white' : 'bg-white/10 hover:bg-white/25'
            }`}
            aria-label={`${label} ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

function MedicationRow({
  value,
  onToggle,
}: {
  value: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-gray-400 text-sm">Medication</span>
      <button
        onClick={onToggle}
        className={`text-sm font-medium px-3 py-0.5 rounded-full transition-colors ${
          value
            ? 'bg-white/10 text-white hover:bg-white/20'
            : 'bg-white/5 text-white/40 hover:bg-white/10'
        }`}
      >
        {value ? 'Taken' : 'Skipped'}
      </button>
    </div>
  )
}

interface JournalPageProps {
  moodScore?: number
}

export default function JournalPage({ moodScore }: JournalPageProps) {
  const [dayOffset, setDayOffset] = useState(0)
  const [entries, setEntries] = useState<Record<number, DayEntry>>({
    0: makeDefault(moodScore),
  })

  function getEntry(offset: number): DayEntry {
    return entries[offset] ?? makeDefault()
  }

  function updateEntry(offset: number, patch: Partial<DayEntry>) {
    setEntries((prev) => ({
      ...prev,
      [offset]: { ...getEntry(offset), ...patch },
    }))
  }

  const entry = getEntry(dayOffset)

  return (
    <div className="w-full max-w-sm px-4">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => setDayOffset((d) => d - 1)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Previous day"
        >
          ‹
        </button>
        <button
          onClick={() => setDayOffset((d) => d + 1)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      <div>
        <p className="text-white text-sm font-medium text-center mb-6">
          {formatDate(dayOffset)}
        </p>
        <div className="bg-white/5 rounded-2xl px-6 py-2">
          <ScoreRow
            label="Mood"
            value={entry.mood}
            onChange={(v) => updateEntry(dayOffset, { mood: v })}
          />
          <ScoreRow
            label="Stress"
            value={entry.stress}
            onChange={(v) => updateEntry(dayOffset, { stress: v })}
          />
          <ScoreRow
            label="Exercise"
            value={entry.exercise}
            onChange={(v) => updateEntry(dayOffset, { exercise: v })}
          />
          <MedicationRow
            value={entry.medication}
            onToggle={() => updateEntry(dayOffset, { medication: !entry.medication })}
          />
        </div>
      </div>
    </div>
  )
}
