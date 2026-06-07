import { useState, useEffect } from 'react'

interface Props {
  src: string
  alt: string
}

export function DiagramLightbox({ src, alt }: Props) {
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
        className="text-xs text-blue-600 underline hover:text-blue-800 block mt-1"
      >
        ? What is this?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white rounded-lg shadow-2xl p-3 max-w-3xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-900 text-lg font-bold leading-none"
              aria-label="Close"
            >
              ×
            </button>
            <img
              src={src}
              alt={alt}
              className="w-full rounded"
              style={{ filter: 'contrast(1.25) brightness(0.96)' }}
            />
          </div>
        </div>
      )}
    </>
  )
}
