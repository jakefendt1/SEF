import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { ChevronLeft } from 'lucide-react'
import intraloxLogo from '../../assets/intralox-logo.svg'
import { InstallPrompt } from '../InstallPrompt'
import { useAuthStore } from '../../store/authStore'
import { useAssessmentsStore } from '../../store/assessmentsStore'
import { useRoiCalculationsStore } from '../../store/roiCalculationsStore'
import { migrateLegacyAssessmentsForUser } from '../../lib/migrateLegacyAssessments'
import { importLegacyRoiCalculationsForUser } from '../../lib/importLegacyRoiCalculations'
import { resolveNav } from '../../lib/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, user, signOut } = useAuthStore()
  const { subscribe, unsubscribe, flushQueue } = useAssessmentsStore()
  const subscribeRoi = useRoiCalculationsStore((s) => s.subscribe)
  const unsubscribeRoi = useRoiCalculationsStore((s) => s.unsubscribe)
  const roiLoaded = useRoiCalculationsStore((s) => s.loaded)
  const roiImportDone = useRef(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [location] = useLocation()
  const nav = resolveNav(location)

  useEffect(() => {
    const uid = user?.uid
    if (!uid) return
    migrateLegacyAssessmentsForUser(uid)
      .catch((err) => console.error('[migrateLegacyAssessments]', err))
      .finally(() => subscribe(uid))
    return () => unsubscribe()
  }, [user?.uid, subscribe, unsubscribe])

  // ROI calculations are subscribed at the shell, not inside the calculator
  // page, so the dashboard can show recent activity across both tools without
  // the user having visited /aim-glide first.
  useEffect(() => {
    const uid = user?.uid
    if (!uid) return
    subscribeRoi(uid)
    return () => unsubscribeRoi()
  }, [user?.uid, subscribeRoi, unsubscribeRoi])

  // Import any pre-Firestore calculations left in localStorage. Deliberately
  // waits for `roiLoaded` -- the importer dedupes against what's already in
  // the cloud, so running it before the first snapshot would duplicate
  // everything.
  useEffect(() => {
    const uid = user?.uid
    if (!uid || !roiLoaded || roiImportDone.current) return
    roiImportDone.current = true
    importLegacyRoiCalculationsForUser(uid, useRoiCalculationsStore.getState().calculations).catch(
      (err) => console.error('[importLegacyRoiCalculations]', err),
    )
  }, [user?.uid, roiLoaded])

  useEffect(() => {
    function handleOnline() {
      flushQueue()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [flushQueue])

  return (
    <div className="min-h-screen bg-gray-50">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="sticky top-0 z-[var(--z-app-header)]">
        <header className="bg-brand text-white px-4 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-4 min-w-0 flex-1">
            <img src={intraloxLogo} alt="Intralox" className="h-10 w-auto" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-none">
                Account Manager Hub
              </h1>
            </div>
          </Link>
          {profile && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-blue-100 text-xs hidden sm:block truncate max-w-[120px]">
                {profile.displayName}
              </span>
              <button
                type="button"
                onClick={() => setSignOutOpen(true)}
                className="text-sm text-white/90 hover:text-white border border-blue-400 hover:border-white rounded-lg px-3 min-h-[44px]"
              >
                Sign out
              </button>
            </div>
          )}
        </header>

        {/* Back bar. In an installed PWA there is no browser back button, so
            this is the only way out of a tool -- it has to be obvious and big. */}
        {nav.backHref && (
          <nav
            aria-label="Breadcrumb"
            className="bg-white border-b border-gray-200 px-2 flex items-center gap-2"
          >
            <Link
              href={nav.backHref}
              className="flex items-center gap-1 pl-2 pr-3 min-h-[48px] text-base font-medium text-brand hover:bg-blue-50 rounded-lg"
            >
              <ChevronLeft className="size-5 shrink-0" aria-hidden="true" />
              {nav.backLabel}
            </Link>
            <span className="text-gray-300" aria-hidden="true">
              /
            </span>
            <span className="text-base font-semibold text-gray-800 truncate">{nav.title}</span>
          </nav>
        )}
      </div>

      <InstallPrompt />

      <main id="main-content" className="bg-gray-50">
        {children}
      </main>

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign in again to get back to your evaluations and calculations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => signOut()}>Sign out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
