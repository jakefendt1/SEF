import { Link, Route, Switch } from 'wouter'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthGate } from './components/AuthGate'
import { AppShell } from './components/shell/AppShell'
import { Dashboard } from './components/shell/Dashboard'
import { SpiralEvalListRoute } from './components/spiral-eval/SpiralEvalListRoute'
import { SpiralEvalFormRoute } from './components/spiral-eval/SpiralEvalFormRoute'
import { AimGlideHome } from './components/aim-glide/AimGlideHome'
import { ThemeProvider } from './contexts/ThemeContext'
import { ROUTES } from './lib/navigation'

function NotFound() {
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

export default function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster richColors position="top-center" />
        <AuthGate>
          <AppShell>
            <Switch>
              <Route path={ROUTES.dashboard} component={Dashboard} />
              <Route path={ROUTES.spiralEvalList} component={SpiralEvalListRoute} />
              <Route path={ROUTES.spiralEvalForm} component={SpiralEvalFormRoute} />
              <Route path={ROUTES.aimGlide} component={AimGlideHome} />
              <Route component={NotFound} />
            </Switch>
          </AppShell>
        </AuthGate>
      </TooltipProvider>
    </ThemeProvider>
  )
}
