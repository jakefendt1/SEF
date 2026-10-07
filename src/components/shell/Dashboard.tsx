import { useAuthStore } from '../../store/authStore'
import { TOOLS } from '../../lib/navigation'
import { isBeta } from '../../lib/betaAccess'
import { ADMIN_EMAILS } from '../../lib/access'
import { ROUTES } from '../../lib/navigation'
import { ShieldCheck } from 'lucide-react'
import { useMyTools } from '../../store/useMyTools'
import { ToolCard } from './ToolCard'
import { RecentActivity } from './RecentActivity'

function firstName(displayName: string | undefined): string {
  if (!displayName) return ''
  return displayName.trim().split(/\s+/)[0] ?? ''
}

export function Dashboard() {
  const profile = useAuthStore((s) => s.profile)
  const { tools, loaded, admin } = useMyTools()
  const mine = TOOLS.filter((tool) => tools.includes(tool.id))
  const name = firstName(profile?.displayName)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">
        {name ? `Welcome back, ${name}` : 'Welcome back'}
      </h2>
      <p className="text-base text-gray-600 mb-6">Pick a tool to get started.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mine.map((tool) => (
          <ToolCard
            key={tool.id}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            href={tool.href}
            beta={isBeta(tool.id)}
          />
        ))}
      </div>

      {loaded && mine.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-base font-semibold text-gray-900">No tools turned on for you yet</p>
          <p className="text-base text-gray-600 mt-1">
            Ask {ADMIN_EMAILS[0]} for access. Your tools appear here as soon as they're on.
          </p>
        </div>
      )}
      {!loaded && <p className="text-base text-gray-500">Loading your tools…</p>}

      {admin && (
        <div className="mt-4">
          <ToolCard
            title="Manage access"
            description="See everyone who's signed up and choose which tools each person can use."
            icon={ShieldCheck}
            href={ROUTES.admin}
          />
        </div>
      )}

      <RecentActivity />
    </div>
  )
}
