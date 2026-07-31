import { useEffect, useState } from 'react'
import intraloxLogo from '../assets/intralox-logo.svg'
import { useAuthStore, SIGNUP_DOMAIN_NOT_ALLOWED } from '../store/authStore'
import { SIGNUP_DOMAIN_MESSAGE } from '../lib/allowedEmails'

type Mode = 'signin' | 'create' | 'reset'

function friendlyError(msg: string): string {
  if (msg.includes(SIGNUP_DOMAIN_NOT_ALLOWED)) {
    return SIGNUP_DOMAIN_MESSAGE
  }
  if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
    return 'Incorrect email or password.'
  }
  if (msg.includes('email-already-in-use')) {
    return 'An account with this email already exists.'
  }
  if (msg.includes('weak-password')) {
    return 'Password must be at least 6 characters.'
  }
  if (msg.includes('invalid-email')) {
    return 'Please enter a valid email address.'
  }
  if (msg.includes('too-many-requests')) {
    return 'Too many attempts. Try again later.'
  }
  return 'Something went wrong. Please try again.'
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, init, signIn, createAccount, resetPassword } = useAuthStore()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => { init() }, [init])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    )
  }

  if (user) return <>{children}</>

  function switchMode(next: Mode) {
    setMode(next)
    setName('')
    setEmail('')
    setPassword('')
    setError('')
    setResetSent(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password)
      } else if (mode === 'create') {
        await createAccount(name, email.trim().toLowerCase(), password)
      } else {
        await resetPassword(email.trim().toLowerCase())
        setResetSent(true)
        setBusy(false)
        return
      }
    } catch (err: unknown) {
      setError(friendlyError(err instanceof Error ? err.message : ''))
    }
    setBusy(false)
  }

  const submitLabel = busy
    ? '…'
    : mode === 'signin'
    ? 'Sign in →'
    : mode === 'create'
    ? 'Create account →'
    : 'Send reset link →'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 space-y-6">

        <div className="flex flex-col items-center gap-2">
          <img src={intraloxLogo} alt="Intralox" className="h-10 w-auto" />
          <h1 className="text-xl font-bold text-gray-900">Intralox Account Manager Hub</h1>
          <p className="text-sm text-gray-500">
            {mode === 'signin' ? 'Sign in to continue'
              : mode === 'create' ? 'Create your account'
              : 'Reset your password'}
          </p>
        </div>

        {mode === 'reset' && resetSent ? (
          <div className="text-center space-y-3 py-2">
            <p className="font-semibold text-gray-800">Check your email</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              A reset link was sent to{' '}
              <span className="font-medium text-gray-700">{email}</span>.
            </p>
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="text-sm text-blue-700 hover:underline"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'create' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  autoComplete="name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@intralox.com"
                required
                autoCapitalize="off"
                autoComplete="email"
                inputMode="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {mode === 'create' && (
                <p className="text-sm text-gray-600 mt-1.5">
                  Use your Intralox work email.
                </p>
              )}
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-brand text-white font-semibold py-3.5 rounded-xl text-base disabled:opacity-40"
            >
              {submitLabel}
            </button>
          </form>
        )}

        <div className="text-center text-sm space-y-2 pt-1">
          {mode === 'signin' && (
            <>
              {/* Almost everyone here is signing in, not signing up -- so
                  "Forgot password" gets the emphasis and "Create account"
                  is quiet. */}
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="block w-full text-blue-700 hover:underline font-medium min-h-[44px]"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => switchMode('create')}
                className="block w-full text-gray-600 hover:text-gray-900 min-h-[44px]"
              >
                First time here? Create an account
              </button>
            </>
          )}
          {(mode === 'create' || mode === 'reset') && !resetSent && (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="text-blue-700 hover:underline min-h-[44px]"
            >
              Back to sign in
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
