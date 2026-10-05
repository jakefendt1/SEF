import { Link } from 'wouter'
import { ROUTES } from '../../lib/navigation'

export function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-semibold text-gray-900">We couldn't find that page</h2>
      <p className="text-base text-gray-600 mt-2">
        It may have been renamed, or the link may be out of date.
      </p>
      {/* A plain <a> would force a full page reload and re-run the whole auth
          handshake; wouter keeps it a client-side navigation. */}
      <Link
        href={ROUTES.dashboard}
        className="inline-flex items-center justify-center mt-6 px-5 min-h-[48px] rounded-lg bg-brand text-white text-base font-semibold hover:bg-brand-hover"
      >
        Back to tools
      </Link>
    </div>
  )
}
