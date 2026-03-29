'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import {
  ACTIVITY_OPTIONS,
  DailyEntry,
  ENERGY_LABELS,
  FEELING_OPTIONS,
  MEDICATION_OPTIONS,
  SLEEP_OPTIONS,
  STRESS_LABELS,
  emptyEntry,
  formatLongDate,
  getTodayKey,
} from '@/components/checkInData'

interface CheckInModalProps {
  existingEntry?: DailyEntry
  onComplete: (entry: DailyEntry) => void
}

interface StepOption<T extends string | number> {
  value: T
  label: string
  hint?: string
  emoji?: string
}

function SliderScale({
  value,
  onChange,
  labels,
}: {
  value: number
  onChange: (value: number) => void
  labels: readonly string[]
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-2">
        {labels.map((label, index) => {
          const selected = value === index + 1
          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange(index + 1)}
              className={`rounded-2xl border px-3 py-4 text-sm font-medium transition-all duration-200 ${
                selected
                  ? 'border-stone-900 bg-stone-900 text-white shadow-lg shadow-stone-900/10'
                  : 'border-stone-200 bg-white text-stone-600 hover:-translate-y-0.5 hover:border-stone-300'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className="rounded-full bg-stone-200/80 p-1">
        <div className="grid grid-cols-5 gap-1">
          {labels.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => onChange(index + 1)}
              className={`h-2 rounded-full transition-all ${
                index < value ? 'bg-stone-900' : 'bg-white'
              }`}
              aria-label={label}
            />
          ))}
        </div>
      </div>
      <p className="text-center text-sm text-stone-500">{labels[value - 1]}</p>
    </div>
  )
}

function ChoiceGrid<T extends string | number>({
  options,
  value,
  onChange,
  columns = 'grid-cols-2',
}: {
  options: readonly StepOption<T>[]
  value: T
  onChange: (value: T) => void
  columns?: string
}) {
  return (
    <div className={`grid gap-3 ${columns}`}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-[1.5rem] border px-4 py-4 text-left transition-all duration-200 ${
              selected
                ? 'border-stone-900 bg-stone-900 text-white shadow-lg shadow-stone-900/10'
                : 'border-stone-200 bg-white text-stone-700 hover:-translate-y-0.5 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {option.emoji ? <span className="text-2xl">{option.emoji}</span> : null}
              <div>
                <p className="text-sm font-semibold">{option.label}</p>
                {option.hint ? (
                  <p className={`text-xs ${selected ? 'text-white/75' : 'text-stone-500'}`}>
                    {option.hint}
                  </p>
                ) : null}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default function CheckInModal({
  existingEntry,
  onComplete,
}: CheckInModalProps) {
  const todayKey = getTodayKey()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<DailyEntry>(() => existingEntry ?? emptyEntry(todayKey))

  const isChronicPainPatient = true

  const steps = [
    {
      key: 'feeling',
      eyebrow: 'Daily check-in',
      title: 'How are you feeling today?',
      description: 'A quick snapshot helps track the tone of your day.',
      content: (
        <ChoiceGrid
          value={answers.feeling}
          onChange={(feeling) => setAnswers((prev) => ({ ...prev, feeling }))}
          options={FEELING_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
            emoji: option.emoji,
          }))}
          columns="grid-cols-2"
        />
      ),
    },
    {
      key: 'energy',
      eyebrow: 'Energy',
      title: 'How is your energy?',
      description: 'Choose the option that feels closest to your energy today.',
      content: (
        <SliderScale
          value={answers.energy}
          onChange={(energy) => setAnswers((prev) => ({ ...prev, energy }))}
          labels={ENERGY_LABELS}
        />
      ),
    },
    {
      key: 'sleep',
      eyebrow: 'Sleep',
      title: 'How was your sleep?',
      description: 'Sleep quality often shapes the rest of the day.',
      content: (
        <ChoiceGrid
          value={answers.sleep}
          onChange={(sleep) => setAnswers((prev) => ({ ...prev, sleep }))}
          options={SLEEP_OPTIONS.map((option) => ({ value: option, label: option }))}
          columns="grid-cols-3"
        />
      ),
    },
    ...(isChronicPainPatient
      ? [
          {
            key: 'painLevel',
            eyebrow: 'Pain',
            title: 'How was your pain level today?',
            description: 'This question only appears for chronic pain tracking.',
            content: (
              <div className="space-y-5">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={answers.painLevel ?? 4}
                  onChange={(event) =>
                    setAnswers((prev) => ({
                      ...prev,
                      painLevel: Number(event.target.value),
                    }))
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-stone-900"
                />
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>1</span>
                  <span>10</span>
                </div>
                <p className="text-center text-3xl font-semibold text-stone-900">
                  {answers.painLevel ?? 4}
                </p>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'stress',
      eyebrow: 'Stress',
      title: 'How stressed do you feel?',
      description: 'A simple check can make patterns easier to spot later.',
      content: (
        <SliderScale
          value={answers.stress}
          onChange={(stress) => setAnswers((prev) => ({ ...prev, stress }))}
          labels={STRESS_LABELS}
        />
      ),
    },
    {
      key: 'activity',
      eyebrow: 'Activity',
      title: 'How active were you today?',
      description: 'Pick the level that best matches your day overall.',
      content: (
        <ChoiceGrid
          value={answers.activity}
          onChange={(activity) => setAnswers((prev) => ({ ...prev, activity }))}
          options={ACTIVITY_OPTIONS.map((option) => ({ value: option, label: option }))}
          columns="grid-cols-1"
        />
      ),
    },
    {
      key: 'medication',
      eyebrow: 'Medication',
      title: 'Did you take your medications?',
      description: 'This helps connect treatment adherence with symptoms and routines.',
      content: (
        <ChoiceGrid
          value={answers.medication}
          onChange={(medication) => setAnswers((prev) => ({ ...prev, medication }))}
          options={MEDICATION_OPTIONS.map((option) => ({ value: option, label: option }))}
          columns="grid-cols-3"
        />
      ),
    },
  ] as const

  const currentStep = steps[step]
  const isLastStep = step === steps.length - 1

  function handleSave() {
    onComplete({
      ...answers,
      date: todayKey,
      completedAt: new Date().toISOString(),
    })
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(190,198,189,0.35)] backdrop-blur-xl sm:p-8">
      <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(211,227,220,0.75),_transparent_70%)]" />

      <div className="relative flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
              {formatLongDate(todayKey)}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-stone-900 sm:text-3xl">
              Daily check-in
            </h2>
          </div>
          <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-500">
            Question {step + 1} of {steps.length}
          </div>
        </div>

        <div className="rounded-full bg-stone-100 p-1">
          <div
            className="h-2 rounded-full bg-stone-900 transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.key}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -22 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <p className="text-sm font-medium text-stone-400">{currentStep.eyebrow}</p>
              <h3 className="text-3xl font-semibold tracking-tight text-stone-900">
                {currentStep.title}
              </h3>
              <p className="max-w-xl text-base leading-7 text-stone-500">
                {currentStep.description}
              </p>
            </div>
            {currentStep.content}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(0, prev - 1))}
            disabled={step === 0}
            className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-500 transition hover:border-stone-300 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Back
          </button>
          <button
            type="button"
            onClick={isLastStep ? handleSave : () => setStep((prev) => prev + 1)}
            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-stone-900/10 transition hover:-translate-y-0.5 hover:bg-stone-800"
          >
            {isLastStep ? 'Save today’s check-in' : 'Continue'}
          </button>
        </div>
      </div>
    </section>
  )
}
