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
import { OnetrackHome } from './components/onetrack/OnetrackHome'
import { ToolGate } from './components/shell/ToolGate'
import { AccessAdmin } from './components/admin/AccessAdmin'
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
              {/* Every tool sits behind its access grant (lib/access.ts). */}
              <Route path={ROUTES.spiralEvalList}>
                <ToolGate toolId="spiral-eval"><SpiralEvalListRoute /></ToolGate>
              </Route>
              <Route path={ROUTES.spiralEvalForm}>
                <ToolGate toolId="spiral-eval"><SpiralEvalFormRoute /></ToolGate>
              </Route>
              <Route path={ROUTES.aimGlide}>
                <ToolGate toolId="aim-glide"><AimGlideHome /></ToolGate>
              </Route>
              <Route path={ROUTES.beltElongation}>
                <ToolGate toolId="belt-elongation"><BeltElongationHome /></ToolGate>
              </Route>
              <Route path={ROUTES.tdBulkDensity}>
                <ToolGate toolId="td-bulk-density"><TdBulkDensityHome /></ToolGate>
              </Route>
              <Route path={ROUTES.tdBulkDensityRun}>
                <ToolGate toolId="td-bulk-density"><TdBulkDensityHome /></ToolGate>
              </Route>
              <Route path={ROUTES.onetrack}>
                <ToolGate toolId="onetrack"><OnetrackHome /></ToolGate>
              </Route>
              <Route path={ROUTES.onetrackBom}>
                <ToolGate toolId="onetrack"><OnetrackHome /></ToolGate>
              </Route>
              <Route path={ROUTES.admin} component={AccessAdmin} />
              <Route component={NotFound} />
            </Switch>
          </AppShell>
        </AuthGate>
      </TooltipProvider>
    </ThemeProvider>
  )
}
