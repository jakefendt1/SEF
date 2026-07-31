import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import intraloxLogo from '../../assets/intralox-logo.svg'
import { InstallPrompt } from '../InstallPrompt'
import { useAuthStore } from '../../store/authStore'
import { useAssessmentsStore } from '../../store/assessmentsStore'
import { migrateLegacyAssessmentsForUser } from '../../lib/migrateLegacyAssessments'
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
  const [signOutOpen, setSignOutOpen] = useState(false)

  useEffect(() => {
    const uid = user?.uid
    if (!uid) return
    migrateLegacyAssessmentsForUser(uid)
      .catch((err) => console.error('[migrateLegacyAssessments]', err))
      .finally(() => subscribe(uid))
    return () => unsubscribe()
  }, [user?.uid, subscribe, unsubscribe])

  useEffect(() => {
    function handleOnline() {
      flushQueue()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [flushQueue])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1e3a5f] text-white px-4 py-3 flex items-center gap-4 sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-4 min-w-0 flex-1">
          <img src={intraloxLogo} alt="Intralox" className="h-10 w-auto" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight leading-none">Intralox Account Manager Hub</h1>
          </div>
        </Link>
        {profile && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-blue-200 text-xs hidden sm:block truncate max-w-[120px]">
              {profile.displayName}
            </span>
            <button
              type="button"
              onClick={() => setSignOutOpen(true)}
              className="text-xs text-blue-300 hover:text-white border border-blue-500 hover:border-white rounded px-2 py-1 min-h-[32px]"
            >
              Sign out
            </button>
          </div>
        )}
      </header>

      <InstallPrompt />

      <main className="bg-gray-50">{children}</main>

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign in again to get back to your assessments and calculations.
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
