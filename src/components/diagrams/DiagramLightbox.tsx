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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
        <span>{label}</span>
        <svg className="w-3.5 h-3.5 ml-auto shrink-0 opacity-60" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
              <span className="font-semibold text-gray-800 text-sm">{label}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <img
                src={src}
                alt={alt}
                className="w-full rounded"
                style={{ filter: 'contrast(1.25) brightness(0.96)' }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
