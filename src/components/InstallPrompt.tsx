import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  if (!prompt || dismissed) return null

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setPrompt(null)
    else setDismissed(true)
  }

  return (
    <div className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between gap-3">
      <p className="text-sm">Add Spiral Eval to your home screen for offline access.</p>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-300 text-xs hover:text-white"
        >
          Later
        </button>
        <button
          onClick={install}
          className="bg-white text-blue-900 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50"
        >
          Install
        </button>
      </div>
    </div>
  )
}
