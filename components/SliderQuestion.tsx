'use client'

interface SliderQuestionProps {
  label: string
  min: number
  max: number
  value: number
  onChange: (value: number) => void
}

export default function SliderQuestion({
  label,
  min,
  max,
  value,
  onChange,
}: SliderQuestionProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">{min}</span>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 bg-gray-200"
        />
        <span className="text-xs text-gray-500">{max}</span>
      </div>
      <span className="text-sm text-gray-600 text-center">{value}</span>
    </div>
  )
}
