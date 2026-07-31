import { ClipboardList, Calculator } from 'lucide-react'
import { ToolCard } from './ToolCard'

export function Dashboard() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Tools</h2>
      <p className="text-sm text-gray-500 mb-6">Pick a tool to get started.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ToolCard
          title="Spiral Eval"
          description="Field evaluation form for Intralox spiral conveyor assessments."
          icon={ClipboardList}
          href="/spiral-eval"
        />
        <ToolCard
          title="AIM Glide ROI Calculator"
          description="Compare total cost of ownership and ROI for AIM Glide vs. traditional slat switch."
          icon={Calculator}
          href="/aim-glide"
        />
      </div>
    </div>
  )
}
