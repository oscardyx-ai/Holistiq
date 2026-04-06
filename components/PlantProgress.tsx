'use client'

import { motion } from 'framer-motion'

function TreeStage({ stage }: { stage: number }) {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full">
      <ellipse cx="160" cy="232" rx="92" ry="22" fill="#764211" />
      <path d="M72 230c29-23 147-23 176 0v28H72z" fill="#8c4d16" />

      {stage >= 0 ? (
        <motion.g initial={{ scale: 0.96, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }}>
          <rect x="154" y="200" width="12" height="28" rx="6" fill="#5a6e2d" />
        </motion.g>
      ) : null}

      {stage >= 1 ? (
        <motion.g
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <path d="M160 204c-3-18-11-30-24-35 2 23 10 34 24 35Z" fill="#8bc34d" />
          <path d="M160 204c3-18 11-30 24-35-2 23-10 34-24 35Z" fill="#7ab341" />
        </motion.g>
      ) : null}

      {stage >= 2 ? (
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <rect x="155" y="172" width="10" height="56" rx="5" fill="#6c7d37" />
          <path d="M160 184c-4-14-16-23-32-27 6 19 18 29 32 27Z" fill="#9fd25b" />
          <path d="M160 188c6-13 16-21 32-24-3 17-14 25-32 24Z" fill="#8ac54d" />
        </motion.g>
      ) : null}

      {stage >= 3 ? (
        <motion.g
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <rect x="152" y="146" width="16" height="82" rx="8" fill="#6d5629" />
          <circle cx="160" cy="132" r="28" fill="#7faf4e" />
          <circle cx="138" cy="150" r="20" fill="#8dbc5a" />
          <circle cx="182" cy="150" r="20" fill="#8dbc5a" />
        </motion.g>
      ) : null}

      {stage >= 4 ? (
        <motion.g
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
        >
          <circle cx="160" cy="116" r="38" fill="#7ca94b" />
          <circle cx="126" cy="140" r="26" fill="#95bf61" />
          <circle cx="194" cy="138" r="26" fill="#95bf61" />
          <circle cx="148" cy="154" r="22" fill="#88b654" />
          <circle cx="178" cy="156" r="22" fill="#88b654" />
        </motion.g>
      ) : null}

      {stage >= 5 ? (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <circle cx="132" cy="122" r="5" fill="#fff0af" />
          <circle cx="176" cy="102" r="5" fill="#fff0af" />
          <circle cx="194" cy="144" r="5" fill="#fff0af" />
        </motion.g>
      ) : null}
    </svg>
  )
}

export default function PlantProgress({
  stage,
  progress,
  monthLabel,
  completedSlots,
  targetSlots,
}: {
  stage: number
  progress: number
  monthLabel: string
  completedSlots: number
  targetSlots: number
}) {
  return (
    <section className="rounded-[2.5rem] border border-white/70 bg-[rgba(248,244,235,0.94)] p-5 shadow-[0_22px_80px_rgba(120,133,107,0.16)]">
      <div className="mx-auto aspect-square max-w-[18rem]">
        <TreeStage stage={stage} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#456246]">{monthLabel}</p>
          <p className="text-sm text-stone-500">Monthly growth</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl text-stone-900">{Math.round(progress * 100)}%</p>
          <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
            {completedSlots}/{targetSlots} slots
          </p>
        </div>
      </div>
    </section>
  )
}
