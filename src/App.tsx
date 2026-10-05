import { Route, Switch } from 'wouter'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthGate } from './components/AuthGate'
import { AppShell } from './components/shell/AppShell'
import { Dashboard } from './components/shell/Dashboard'
import { NotFound } from './components/shell/NotFound'
import { SpiralEvalListRoute } from './components/spiral-eval/SpiralEvalListRoute'
import { SpiralEvalFormRoute } from './components/spiral-eval/SpiralEvalFormRoute'
import { AimGlideHome } from './components/aim-glide/AimGlideHome'
import { BeltElongationHome } from './components/belt-elongation/BeltElongationHome'
import { TdBulkDensityHome } from './components/td-bulk-density/TdBulkDensityHome'
import { OnetrackRoute } from './components/onetrack/OnetrackRoute'
import { ThemeProvider } from './contexts/ThemeContext'
import { ROUTES } from './lib/navigation'

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
              <Route path={ROUTES.beltElongation} component={BeltElongationHome} />
              <Route path={ROUTES.tdBulkDensity} component={TdBulkDensityHome} />
              <Route path={ROUTES.tdBulkDensityRun} component={TdBulkDensityHome} />
              <Route path={ROUTES.onetrack} component={OnetrackRoute} />
              <Route path={ROUTES.onetrackBom} component={OnetrackRoute} />
              <Route component={NotFound} />
            </Switch>
          </AppShell>
        </AuthGate>
      </TooltipProvider>
    </ThemeProvider>
  )
}
