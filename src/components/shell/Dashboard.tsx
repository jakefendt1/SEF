import { useAuthStore } from '../../store/authStore'
import { TOOLS } from '../../lib/navigation'
import { ToolCard } from './ToolCard'
import { RecentActivity } from './RecentActivity'

function firstName(displayName: string | undefined): string {
  if (!displayName) return ''
  return displayName.trim().split(/\s+/)[0] ?? ''
}

export function Dashboard() {
  const profile = useAuthStore((s) => s.profile)
  const name = firstName(profile?.displayName)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">
        {name ? `Welcome back, ${name}` : 'Welcome back'}
      </h2>
      <p className="text-base text-gray-600 mb-6">Pick a tool to get started.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TOOLS.map((tool) => (
          <ToolCard
            key={tool.id}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            href={tool.href}
          />
        ))}
      </div>

      <RecentActivity />
    </div>
  )
}
