export default function LogoWordmark({
  compact = false,
  inverted = false,
}: {
  compact?: boolean
  inverted?: boolean
}) {
  return (
    <div className="inline-flex items-center gap-3">
      <div
        aria-hidden="true"
        className={`h-3 w-3 rounded-full ${
          inverted
            ? 'bg-white/80 shadow-[0_0_0_8px_rgba(255,255,255,0.15)]'
            : 'bg-[#4c956c] shadow-[0_0_0_8px_rgba(76,149,108,0.14)]'
        }`}
      />
      <span
        className={`font-brand leading-none ${inverted ? 'text-white' : 'text-[#4c956c]'} ${
          compact ? 'text-3xl' : 'text-5xl sm:text-6xl'
        }`}
      >
        Holistiq
      </span>
    </div>
  )
}
