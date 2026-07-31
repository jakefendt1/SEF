import { useState } from 'react'
import { cn } from '../../lib/utils'

interface Props {
  title: string
  isQuickMode: boolean
  hasFullFields?: boolean
  children: (showFull: boolean) => React.ReactNode
}

export function SectionCard({ title, isQuickMode, hasFullFields = false, children }: Props) {
  const [expanded, setExpanded] = useState(false)
  const showFull = !isQuickMode || expanded
  const showExpandButton = isQuickMode && hasFullFields

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        {showExpandButton && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              'text-xs font-medium px-3 py-1 rounded-full transition-colors',
              expanded
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
            )}
          >
            {expanded ? 'Show less' : 'Show full detail'}
          </button>
        )}
      </div>
      <div className="px-4 py-4 space-y-5">
        {children(showFull)}
      </div>
    </section>
  )
}
