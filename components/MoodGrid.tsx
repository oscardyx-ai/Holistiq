'use client'

import { useState } from 'react'

type View = 'week' | 'month' | 'year'

const MOOD_COLORS: Record<number, string> = {
  0: 'bg-gray-700',
  1: 'bg-blue-500',
  2: 'bg-purple-500',
  3: 'bg-red-500',
  4: 'bg-orange-400',
  5: 'bg-yellow-400',
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Deterministic pseudo-random mood from date
function getMood(date: Date): number {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  return ((seed * 1103515245 + 12345) >>> 0) % 6
}

function isFuture(date: Date): boolean {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date > today
}

// Monday-based day index: 0=Mon … 6=Sun
function monDayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

function Cell({ date, size }: { date: Date; size: 'sm' | 'md' | 'lg' }) {
  const future = isFuture(date)
  const mood = future ? 0 : getMood(date)
  const sizeClass = size === 'lg' ? 'w-10 h-10 rounded-lg' : size === 'md' ? 'w-8 h-8 rounded-md' : 'w-4 h-4 rounded-sm'
  return (
    <div
      className={`${sizeClass} ${MOOD_COLORS[mood]} ${future ? 'opacity-20' : ''} transition-opacity`}
      title={date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
    />
  )
}

function WeekView() {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - 6 + i)
    return d
  })

  return (
    <div className="flex gap-3 justify-center">
      {days.map((date, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <span className="text-xs text-gray-500">
            {date.toLocaleDateString('en-US', { weekday: 'short' })}
          </span>
          <Cell date={date} size="lg" />
          <span className="text-xs text-gray-500">{date.getDate()}</span>
        </div>
      ))}
    </div>
  )
}

function MonthView() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = monDayIndex(new Date(year, month, 1))

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs text-gray-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) =>
          day === null ? (
            <div key={i} className="w-8 h-8" />
          ) : (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <Cell date={new Date(year, month, day)} size="md" />
              <span className="text-xs text-gray-600">{day}</span>
            </div>
          )
        )}
      </div>
    </div>
  )
}

function YearView() {
  const year = new Date().getFullYear()

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col gap-1.5 min-w-max">
        {MONTH_LABELS.map((label, monthIndex) => {
          const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
          return (
            <div key={monthIndex} className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 w-7 shrink-0">{label}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <Cell key={i} date={new Date(year, monthIndex, i + 1)} size="sm" />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MoodGrid() {
  const [view, setView] = useState<View>('month')

  return (
    <div className="bg-gray-900 rounded-2xl p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-white text-sm font-medium">Mood History</span>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {(['week', 'month', 'year'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                view === v ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'week' && <WeekView />}
      {view === 'month' && <MonthView />}
      {view === 'year' && <YearView />}

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-gray-600">Mood</span>
        {Object.entries(MOOD_COLORS).map(([score, color]) => (
          <div key={score} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-sm ${color}`} />
            <span className="text-xs text-gray-600">{score === '0' ? 'none' : score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
