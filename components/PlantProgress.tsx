'use client'

import { motion } from 'framer-motion'

function ProgressRing({ progress }: { progress: number }) {
  const angle = `${Math.max(0.05, progress) * 360}deg`

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 rounded-[2.5rem]"
      style={{
        background: `conic-gradient(from 180deg, rgba(135, 173, 100, 0.92) 0deg ${angle}, rgba(224, 216, 193, 0.52) ${angle} 360deg)`,
      }}
    />
  )
}

function TreeStage({ stage }: { stage: number }) {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full">
      <defs>
        <radialGradient id="sun-glow" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#fff8db" />
          <stop offset="100%" stopColor="#f4e8b7" />
        </radialGradient>
      </defs>

      <circle cx="160" cy="150" r="110" fill="url(#sun-glow)" />
      <ellipse cx="160" cy="188" rx="88" ry="24" fill="#764211" />
      <path d="M78 186c26-26 138-26 164 0v30H78z" fill="#8c4d16" />

      {stage >= 0 ? (
        <motion.g initial={{ scale: 0.96, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }}>
          <rect x="154" y="162" width="12" height="22" rx="6" fill="#5a6e2d" />
        </motion.g>
      ) : null}

      {stage >= 1 ? (
        <motion.g
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <path d="M160 166c-3-18-11-30-24-35 2 23 10 34 24 35Z" fill="#8bc34d" />
          <path d="M160 166c3-18 11-30 24-35-2 23-10 34-24 35Z" fill="#7ab341" />
        </motion.g>
      ) : null}

      {stage >= 2 ? (
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <rect x="155" y="136" width="10" height="38" rx="5" fill="#6c7d37" />
          <path d="M160 146c-4-14-16-23-32-27 6 19 18 29 32 27Z" fill="#9fd25b" />
          <path d="M160 151c6-13 16-21 32-24-3 17-14 25-32 24Z" fill="#8ac54d" />
        </motion.g>
      ) : null}

      {stage >= 3 ? (
        <motion.g
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <rect x="152" y="116" width="16" height="62" rx="8" fill="#6d5629" />
          <circle cx="160" cy="98" r="26" fill="#7faf4e" />
          <circle cx="138" cy="112" r="18" fill="#8dbc5a" />
          <circle cx="182" cy="112" r="18" fill="#8dbc5a" />
        </motion.g>
      ) : null}

      {stage >= 4 ? (
        <motion.g
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
        >
          <circle cx="160" cy="88" r="34" fill="#7ca94b" />
          <circle cx="128" cy="106" r="24" fill="#95bf61" />
          <circle cx="192" cy="104" r="24" fill="#95bf61" />
          <circle cx="150" cy="122" r="20" fill="#88b654" />
          <circle cx="176" cy="124" r="20" fill="#88b654" />
        </motion.g>
      ) : null}

      {stage >= 5 ? (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <circle cx="132" cy="100" r="5" fill="#fff0af" />
          <circle cx="176" cy="84" r="5" fill="#fff0af" />
          <circle cx="194" cy="118" r="5" fill="#fff0af" />
        </motion.g>
      ) : null}
    </svg>
  )
}

export default function PlantProgress({
  stage,
  progress,
  monthLabel,
  completedDays,
  daysInMonth,
}: {
  stage: number
  progress: number
  monthLabel: string
  completedDays: number
  daysInMonth: number
}) {
  return (
    <section className="relative rounded-[2.5rem] border border-white/70 bg-[rgba(246,241,229,0.9)] p-4 shadow-[0_22px_80px_rgba(120,133,107,0.18)]">
      <div className="relative mx-auto aspect-square max-w-[21rem] rounded-[2.5rem] p-3">
        <ProgressRing progress={progress} />
        <div className="relative h-full rounded-[2rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(248,241,214,0.96)_45%,_rgba(244,231,192,0.92)_100%)] p-6 shadow-inner">
          <TreeStage stage={stage} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-[1.6rem] bg-white/70 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-[#456246]">{monthLabel}</p>
          <p className="text-sm text-stone-500">Growth resets with each new month.</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl text-stone-900">{completedDays}</p>
          <p className="text-xs uppercase tracking-[0.22em] text-stone-400">of {daysInMonth}</p>
        </div>
      </div>
    </section>
  )
}
