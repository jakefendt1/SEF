import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { ROUTES } from '../lib/navigation'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [location] = useLocation()

  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  // Only on the dashboard. Interrupting someone mid-form with an install
  // banner pushes the page down and costs them their place.
  if (!prompt || dismissed || location !== ROUTES.dashboard) return null

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setPrompt(null)
    else setDismissed(true)
  }

  return (
    <div className="bg-brand text-white px-4 py-3 flex items-center justify-between gap-3">
      <p className="text-sm">
        Add the Account Manager Hub to your home screen so it works without a signal.
      </p>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-100 text-sm hover:text-white px-3 min-h-[44px]"
        >
          Later
        </button>
        <button
          onClick={install}
          className="bg-white text-brand text-sm font-semibold px-4 min-h-[44px] rounded-lg hover:bg-blue-50"
        >
          Install
        </button>
      </div>
    </div>
  )
}
