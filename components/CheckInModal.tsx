'use client'

import { useState } from 'react'

const FACES = [
  { score: 1, emoji: '😫' },
  { score: 2, emoji: '😞' },
  { score: 3, emoji: '😐' },
  { score: 4, emoji: '🙂' },
  { score: 5, emoji: '😄' },
]

interface CheckInModalProps {
  onComplete: (score: number) => void
}

export default function CheckInModal({ onComplete }: CheckInModalProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  function select(score: number) {
    setVisible(false)
    onComplete(score)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl px-8 py-10 flex flex-col items-center gap-6 shadow-xl">
        <p className="text-white text-lg font-medium">How are you feeling today?</p>
        <div className="flex gap-4">
          {FACES.map(({ score, emoji }) => (
            <button
              key={score}
              onClick={() => select(score)}
              className="text-4xl hover:scale-110 active:scale-95 transition-transform"
              aria-label={`Mood ${score}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
