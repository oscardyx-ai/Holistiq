export default function LogoWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex items-center gap-3">
      <div
        aria-hidden="true"
        className="h-3 w-3 rounded-full bg-[#4c956c] shadow-[0_0_0_8px_rgba(76,149,108,0.14)]"
      />
      <span
        className={`font-brand leading-none text-[#4c956c] ${
          compact ? 'text-3xl' : 'text-5xl sm:text-6xl'
        }`}
      >
        Holistiq
      </span>
    </div>
  )
}
