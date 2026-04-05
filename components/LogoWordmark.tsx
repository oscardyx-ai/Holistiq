export default function LogoWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex items-center gap-3">
      <div
        aria-hidden="true"
        className="h-3 w-3 rounded-full bg-[#8bb45d] shadow-[0_0_0_8px_rgba(139,180,93,0.14)]"
      />
      <span
        className={`font-brand leading-none text-[#8bb45d] ${
          compact ? 'text-3xl' : 'text-5xl sm:text-6xl'
        }`}
      >
        Holistiq
      </span>
    </div>
  )
}
