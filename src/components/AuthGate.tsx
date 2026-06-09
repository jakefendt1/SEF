import { useEffect, useState } from 'react'
import intraloxLogo from '../assets/intralox-logo.svg'
import { useAuthStore } from '../store/authStore'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, magicLinkSent, init, sendMagicLink } = useAuthStore()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { init() }, [init])

  // Still resolving cached auth token
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    )
  }

  // Signed in — show the app
  if (user) return <>{children}</>

  // Not signed in — show sign-in screen
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setError('')
    try {
      await sendMagicLink(email.trim().toLowerCase())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send link. Try again.')
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 space-y-6">

        <div className="flex flex-col items-center gap-2">
          <img src={intraloxLogo} alt="Intralox" className="h-10 w-auto" />
          <h1 className="text-xl font-bold text-gray-900">Spiral Eval</h1>
          <p className="text-sm text-gray-500">Sign in to continue</p>
        </div>

        {magicLinkSent ? (
          <div className="text-center space-y-3 py-2">
            <div className="text-5xl">📬</div>
            <p className="font-semibold text-gray-800 text-lg">Check your email</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              We sent a sign-in link to{' '}
              <span className="font-medium text-gray-700">{email}</span>.
              Tap the link in your email — it'll open the app automatically.
            </p>
            <p className="text-xs text-gray-400">Open the link on this device.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Your Intralox email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@intralox.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoCapitalize="off"
                autoComplete="email"
                inputMode="email"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="w-full bg-[#1e3a5f] text-white font-semibold py-3.5 rounded-xl text-base disabled:opacity-40"
            >
              {sending ? 'Sending…' : 'Send sign-in link →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
