// Every tool's routes sit behind this: someone without access gets a plain
// "ask for access" page rather than the tool. The data rules enforce the same
// thing on the server.
import { Link } from 'wouter'
import { Lock } from 'lucide-react'
import { ADMIN_EMAILS } from '../../lib/access'
import { ROUTES, TOOLS } from '../../lib/navigation'
import { useMyTools } from '../../store/useMyTools'

export function NoAccess({ what }: { what: string }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <Lock className="size-10 mx-auto text-gray-400" aria-hidden="true" />
      <h2 className="text-xl font-semibold text-gray-900 mt-3">You don't have access to {what} yet</h2>
      <p className="text-base text-gray-600 mt-2">
        Ask {ADMIN_EMAILS[0]} to turn it on for you. It shows up as soon as they do.
      </p>
      <Link
        href={ROUTES.dashboard}
        className="inline-flex items-center justify-center mt-6 px-5 min-h-[48px] rounded-lg bg-brand text-white text-base font-semibold hover:bg-brand-hover"
      >
        Back to tools
      </Link>
    </div>
  )
}

export function ToolGate({ toolId, children }: { toolId: string; children: React.ReactNode }) {
  const { tools, loaded } = useMyTools()
  if (!loaded) {
    return <p className="text-center text-base text-gray-500 py-16">Checking your access…</p>
  }
  if (!tools.includes(toolId)) {
    return <NoAccess what={TOOLS.find((t) => t.id === toolId)?.title ?? 'this tool'} />
  }
  return <>{children}</>
}
