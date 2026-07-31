import { Route, Switch } from 'wouter'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthGate } from './components/AuthGate'
import { AppShell } from './components/shell/AppShell'
import { Dashboard } from './components/shell/Dashboard'
import { SpiralEvalListRoute } from './components/spiral-eval/SpiralEvalListRoute'
import { SpiralEvalFormRoute } from './components/spiral-eval/SpiralEvalFormRoute'
import { AimGlideHome } from './components/aim-glide/AimGlideHome'
import { ThemeProvider } from './contexts/ThemeContext'

function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <h2 className="text-lg font-semibold text-gray-900">Page not found</h2>
      <p className="text-sm text-gray-500 mt-1">
        <a href="/" className="text-blue-700 hover:underline">Back to dashboard</a>
      </p>
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
              <Route path="/" component={Dashboard} />
              <Route path="/spiral-eval" component={SpiralEvalListRoute} />
              <Route path="/spiral-eval/:id" component={SpiralEvalFormRoute} />
              <Route path="/aim-glide" component={AimGlideHome} />
              <Route component={NotFound} />
            </Switch>
          </AppShell>
        </AuthGate>
      </TooltipProvider>
    </ThemeProvider>
  )
}
