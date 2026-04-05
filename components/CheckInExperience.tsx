'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import LogoWordmark from '@/components/LogoWordmark'
import {
  ACTIVITY_OPTIONS,
  DailyEntry,
  ENERGY_LABELS,
  FEELING_OPTIONS,
  MEDICATION_OPTIONS,
  SLEEP_OPTIONS,
  STRESS_LABELS,
  cloneEntryForDate,
  emptyEntry,
  formatLongDate,
  getTodayKey,
  getYesterdayEntry,
  readEntriesFromStorage,
  writeEntriesToStorage,
} from '@/components/checkInData'

type QuestionStep =
  | {
      key: 'feeling' | 'sleep' | 'activity' | 'medication'
      eyebrow: string
      title: string
      description: string
      kind: 'choice'
      options: Array<{ label: string; value: string | number; emoji?: string }>
      columns: string
    }
  | {
      key: 'energy' | 'painLevel' | 'stress'
      eyebrow: string
      title: string
      description: string
      kind: 'slider'
      min: number
      max: number
      labels?: readonly string[]
    }

function ChoiceGrid({
  options,
  onSelect,
  value,
  columns,
}: {
  options: Array<{ label: string; value: string | number; emoji?: string }>
  onSelect: (value: string | number) => void
  value: string | number
  columns: string
}) {
  return (
    <div className={`grid gap-3 ${columns}`}>
      {options.map((option) => {
        const selected = option.value === value

        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`rounded-[1.6rem] border px-4 py-5 text-left transition-all duration-200 ${
              selected
                ? 'border-[#6b8f56] bg-[#6b8f56] text-white shadow-[0_12px_24px_rgba(107,143,86,0.22)]'
                : 'border-[#e8e1d3] bg-white text-stone-700 hover:-translate-y-0.5 hover:border-[#d2c6b0]'
            }`}
          >
            <div className="flex items-center gap-3">
              {option.emoji ? <span className="text-2xl">{option.emoji}</span> : null}
              <span className="text-base font-semibold">{option.label}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function SliderStep({
  value,
  min,
  max,
  labels,
  onChange,
}: {
  value: number
  min: number
  max: number
  labels?: readonly string[]
  onChange: (value: number) => void
}) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-6">
      <div className="rounded-[1.7rem] bg-[#f7f2e7] p-6">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent accent-[#6b8f56]"
          style={{
            background: `linear-gradient(90deg, #6b8f56 ${percentage}%, #ded3bf ${percentage}%)`,
          }}
        />
        <div className="mt-4 flex items-center justify-between text-xs text-stone-400">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 rounded-[1.7rem] border border-[#ece5d9] bg-white px-5 py-4">
        <div>
          <p className="text-sm text-stone-500">Current answer</p>
          <p className="font-display mt-1 text-3xl text-stone-900">{value}</p>
        </div>
        {labels ? (
          <p className="max-w-44 text-right text-sm leading-6 text-stone-500">
            {labels[value - min]}
          </p>
        ) : (
          <p className="text-sm text-stone-500">Slide when you&apos;re ready, then continue.</p>
        )}
      </div>
    </div>
  )
}

export default function CheckInExperience() {
  const router = useRouter()
  const todayKey = getTodayKey()
  const [entries, setEntries] = useState<Record<string, DailyEntry>>(() => readEntriesFromStorage())
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<DailyEntry>(() => entries[todayKey] ?? emptyEntry(todayKey))
  const [isSaving, setIsSaving] = useState(false)

  const yesterdayEntry = getYesterdayEntry(entries, todayKey)

  const steps: QuestionStep[] = [
    {
      key: 'feeling',
      eyebrow: 'Feeling',
      title: 'How are you feeling today?',
      description: 'Pick the answer that feels closest. Choice questions move forward automatically.',
      kind: 'choice',
      options: FEELING_OPTIONS.map((option) => ({
        label: option.label,
        value: option.value,
        emoji: option.emoji,
      })),
      columns: 'sm:grid-cols-2',
    },
    {
      key: 'energy',
      eyebrow: 'Energy',
      title: 'How is your energy today?',
      description: 'Use the slider and continue when it feels right.',
      kind: 'slider',
      min: 1,
      max: 5,
      labels: ENERGY_LABELS,
    },
    {
      key: 'sleep',
      eyebrow: 'Sleep',
      title: 'How was your sleep?',
      description: 'A small snapshot now can make patterns easier to spot later.',
      kind: 'choice',
      options: SLEEP_OPTIONS.map((option) => ({
        label: option,
        value: option,
      })),
      columns: 'sm:grid-cols-3',
    },
    {
      key: 'painLevel',
      eyebrow: 'Pain',
      title: 'How would you rate your pain today?',
      description: 'Only move the slider if pain was part of the day you want to track.',
      kind: 'slider',
      min: 1,
      max: 10,
    },
    {
      key: 'stress',
      eyebrow: 'Stress',
      title: 'How stressed do you feel?',
      description: 'Choose the point on the scale that feels most accurate right now.',
      kind: 'slider',
      min: 1,
      max: 5,
      labels: STRESS_LABELS,
    },
    {
      key: 'activity',
      eyebrow: 'Activity',
      title: 'How active were you today?',
      description: 'Think about the whole day rather than a single moment.',
      kind: 'choice',
      options: ACTIVITY_OPTIONS.map((option) => ({
        label: option,
        value: option,
      })),
      columns: 'grid-cols-1',
    },
    {
      key: 'medication',
      eyebrow: 'Medication',
      title: 'Did you take your medications?',
      description: 'This is just for tracking your routine, not for judgment.',
      kind: 'choice',
      options: MEDICATION_OPTIONS.map((option) => ({
        label: option,
        value: option,
      })),
      columns: 'sm:grid-cols-3',
    },
  ]

  const currentStep = steps[stepIndex]
  const progress = ((stepIndex + 1) / steps.length) * 100
  const isLastStep = stepIndex === steps.length - 1

  function persistEntry(entry: DailyEntry) {
    const nextEntries = {
      ...entries,
      [entry.date]: entry,
    }

    setEntries(nextEntries)
    writeEntriesToStorage(nextEntries)
  }

  function saveAndReturn(entry: DailyEntry) {
    setIsSaving(true)
    persistEntry({
      ...entry,
      date: todayKey,
      completedAt: new Date().toISOString(),
    })
    router.push('/')
  }

  function handleChoiceSelect(value: string | number) {
    const nextAnswers = {
      ...answers,
      [currentStep.key]: value,
    } as DailyEntry

    setAnswers(nextAnswers)

    if (isLastStep) {
      saveAndReturn(nextAnswers)
      return
    }

    window.setTimeout(() => {
      setStepIndex((previousStep) => Math.min(previousStep + 1, steps.length - 1))
    }, 160)
  }

  function useYesterdayAnswers() {
    if (!yesterdayEntry) {
      return
    }

    saveAndReturn(cloneEntryForDate(yesterdayEntry, todayKey))
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <LogoWordmark compact />
          <Link
            href="/"
            className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-stone-600 transition hover:-translate-y-0.5"
          >
            Back home
          </Link>
        </header>

        <section className="rounded-[2.5rem] border border-white/70 bg-white/85 p-6 shadow-[0_28px_100px_rgba(120,133,107,0.16)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6f8e58]">
                {formatLongDate(todayKey)}
              </p>
              <h1 className="font-display mt-3 text-3xl text-stone-900 sm:text-4xl">
                Today&apos;s gentle check-in
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
                One question at a time, with a small pause between steps and room to go back if
                you want to change anything.
              </p>
            </div>

            {yesterdayEntry ? (
              <button
                type="button"
                onClick={useYesterdayAnswers}
                className="rounded-full border border-[#d8e5ca] bg-[#eef5e5] px-4 py-3 text-sm font-semibold text-[#456246] transition hover:-translate-y-0.5"
              >
                Same as yesterday
              </button>
            ) : null}
          </div>

          <div className="mt-6 rounded-full bg-[#efe8d9] p-1">
            <div
              className="h-2 rounded-full bg-[#6f9658] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-stone-500">
            <span>
              Question {stepIndex + 1} of {steps.length}
            </span>
            <span>{isSaving ? 'Saving...' : 'Calm progress'}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mt-8 space-y-7"
            >
              <div>
                <p className="text-sm font-medium text-[#6f8e58]">{currentStep.eyebrow}</p>
                <h2 className="font-display mt-3 text-4xl leading-tight text-stone-900">
                  {currentStep.title}
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
                  {currentStep.description}
                </p>
              </div>

              {currentStep.kind === 'choice' ? (
                <ChoiceGrid
                  value={answers[currentStep.key]}
                  onSelect={handleChoiceSelect}
                  options={currentStep.options}
                  columns={currentStep.columns}
                />
              ) : (
                <SliderStep
                  value={
                    currentStep.key === 'painLevel'
                      ? (answers.painLevel ?? 4)
                      : Number(answers[currentStep.key])
                  }
                  min={currentStep.min}
                  max={currentStep.max}
                  labels={currentStep.labels}
                  onChange={(value) =>
                    setAnswers((previousAnswers) => ({
                      ...previousAnswers,
                      [currentStep.key]: value,
                    }))
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStepIndex((previousStep) => Math.max(0, previousStep - 1))}
              disabled={stepIndex === 0}
              className="rounded-full border border-[#e7decd] bg-white px-5 py-3 text-sm font-semibold text-stone-600 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Back
            </button>

            {currentStep.kind === 'slider' ? (
              <button
                type="button"
                onClick={() => {
                  if (isLastStep) {
                    saveAndReturn(answers)
                    return
                  }

                  setStepIndex((previousStep) => Math.min(previousStep + 1, steps.length - 1))
                }}
                className="rounded-full bg-[#6f9658] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                {isLastStep ? "Save today's check-in" : 'Next question'}
              </button>
            ) : (
              <p className="text-sm text-stone-500">Selecting an answer will continue automatically.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
