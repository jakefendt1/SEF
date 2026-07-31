import { useState, useEffect } from 'react'

interface Props {
  src: string
  alt: string
  label: string
}

export function DiagramLightbox({ src, alt, label }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-900 font-medium text-sm transition-colors"
      >
        {/* Magnifier + plus icon */}
        <svg className="w-4 h-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <circle cx="11" cy="11" r="7.5" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
          <line x1="11" y1="8" x2="11" y2="14" strokeLinecap="round" />
          <line x1="8" y1="11" x2="14" y2="11" strokeLinecap="round" />
        </svg>
        <span className="flex-1 text-left leading-snug">{label}</span>
        <span className="text-xs font-normal text-blue-400 shrink-0">Tap to view</span>
      </button>

      {/* Full-screen overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#1e3a5f] text-white shrink-0">
            <span className="font-bold text-base leading-snug pr-4">{label}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/35 text-white text-3xl font-bold leading-none shrink-0"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Image — scrollable, fills screen width */}
          <div className="flex-1 overflow-auto bg-gray-50">
            <img
              src={src}
              alt={alt}
              className="w-full block"
              style={{ filter: 'contrast(1.3) brightness(0.95)' }}
            />
          </div>

          {/* Bottom close bar — easy thumb reach */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full py-5 bg-[#1e3a5f] text-white font-bold text-lg tracking-wide shrink-0"
          >
            ✕  Close
          </button>
        </div>
      )}
    </>
  )
}
