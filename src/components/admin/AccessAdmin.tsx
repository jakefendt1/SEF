// Manage access: every signed-up user (and every email approved ahead of
// sign-up), searchable, with a switch per tool. Live: a new sign-up appears
// here within a second or two, and a switch reaches that person's dashboard
// just as fast. A new tool in lib/navigation.ts TOOLS gets a switch here
// automatically, off for everyone.
import { useEffect, useMemo, useState } from 'react'
import { Check, Search, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { adminRows, isAdmin, isDefaultTool, toggleTool, ALL_TOOL_IDS, type AccessGrant, type AdminRow } from '@/lib/access'
import { isAllowedSignupEmail } from '@/lib/allowedEmails'
import { putAccess, subscribeAllAccess, subscribeAllProfiles, type ProfileRow } from '@/lib/firestoreAccess'
import { TOOLS } from '@/lib/navigation'
import { raceWrite, WRITE_MESSAGES } from '@/lib/writeOutcome'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { NoAccess } from '../shell/ToolGate'

function ToolSwitch({ label, on, disabled, onChange }: { label: string; on: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cn(
        'min-h-[48px] rounded-lg border px-3 text-left text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60',
        on ? 'border-brand bg-blue-50 text-brand' : 'border-gray-300 bg-white text-gray-600',
      )}
    >
      <span
        className={cn('relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors', on ? 'bg-brand' : 'bg-gray-300')}
        aria-hidden="true"
      >
        <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', on ? 'left-[18px]' : 'left-0.5')} />
      </span>
      {label}
    </button>
  )
}

export function AccessAdmin() {
  const me = useAuthStore((s) => s.user?.email ?? null)
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [grants, setGrants] = useState<AccessGrant[]>([])
  const [loaded, setLoaded] = useState({ profiles: false, grants: false })
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const admin = isAdmin(me)

  useEffect(() => {
    if (!admin) return
    const fail = (err: Error) => setError(err.message)
    const a = subscribeAllProfiles((p) => {
      setProfiles(p)
      setLoaded((l) => ({ ...l, profiles: true }))
    }, fail)
    const b = subscribeAllAccess((g) => {
      setGrants(g)
      setLoaded((l) => ({ ...l, grants: true }))
    }, fail)
    return () => {
      a()
      b()
    }
  }, [admin])

  const rows = useMemo(() => adminRows(profiles, grants, search), [profiles, grants, search])
  const total = useMemo(() => adminRows(profiles, grants).length, [profiles, grants])

  if (!admin) return <NoAccess what="Manage access" />

  const save = async (row: Pick<AdminRow, 'email'>, tools: string[]) => {
    if (!me) return
    setSaving(row.email)
    const { outcome, settled } = await raceWrite(putAccess(row.email, tools, me))
    setSaving(null)
    if (outcome.kind === 'failed') toast.error(`Didn't save. ${outcome.message}`)
    else if (outcome.kind === 'queued') {
      toast(WRITE_MESSAGES.queued)
      void settled.then((o) => {
        if (o.kind === 'failed') toast.error(`${WRITE_MESSAGES.lateFailed} ${o.message}`)
      })
    }
  }

  const addEmail = async () => {
    const email = newEmail.trim().toLowerCase()
    if (!isAllowedSignupEmail(email)) {
      toast.error('Use an @intralox.com address.')
      return
    }
    if (!rows.some((r) => r.email === email) && !grants.some((g) => g.email === email)) {
      await save({ email }, [])
      toast.success(`${email} added. Turn on their tools below; they'll see them when they sign up.`)
    }
    setSearch(email)
    setNewEmail('')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Manage access</h2>
        <p className="text-base text-gray-600">
          Everyone who signs up starts with no tools. Turn on what each person needs; it takes effect right away.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <label className="relative block">
          <span className="sr-only">Search people</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-400 bg-white text-base"
          />
        </label>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void addEmail()
          }}
        >
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Approve someone before they sign up"
            aria-label="Email to approve"
            className="flex-1 min-w-0 h-12 px-4 rounded-lg border border-gray-400 bg-white text-base"
          />
          <Button type="submit" variant="outline" className="min-h-[48px] text-base" disabled={!newEmail.trim()}>
            <UserPlus className="size-5" /> Add
          </Button>
        </form>
      </div>

      {error && <p className="text-base text-warning-orange">Couldn't load everyone: {error}</p>}
      {!loaded.profiles || !loaded.grants ? (
        <p className="text-base text-gray-500">Loading people…</p>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {rows.length === total ? `${total} people` : `${rows.length} of ${total} people`}
          </p>
          <ul className="space-y-3">
            {rows.map((row) => {
              const rowIsAdmin = isAdmin(row.email)
              const all = rowIsAdmin || ALL_TOOL_IDS.every((id) => isDefaultTool(id) || row.tools.includes(id))
              return (
                <li key={row.email} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-gray-900 truncate">{row.name ?? row.email}</p>
                      <p className="text-sm text-gray-600 truncate">
                        {row.name ? row.email : ''}
                        {!row.signedUp && <span className="text-warning-orange">{row.name ? ' · ' : ''}Not signed up yet</span>}
                      </p>
                    </div>
                    {rowIsAdmin ? (
                      <span className="rounded-full bg-brand text-white text-sm font-semibold px-3 py-1">Admin · every tool</span>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="min-h-[44px]"
                          disabled={all || saving === row.email}
                          onClick={() => save(row, [...ALL_TOOL_IDS])}
                        >
                          <Check className="size-4" /> All tools
                        </Button>
                        <Button
                          variant="outline"
                          className="min-h-[44px]"
                          disabled={row.tools.length === 0 || saving === row.email}
                          onClick={() => save(row, [])}
                        >
                          None
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {TOOLS.map((t) => (
                      <ToolSwitch
                        key={t.id}
                        label={isDefaultTool(t.id) ? `${t.title} (everyone)` : t.title}
                        on={rowIsAdmin || isDefaultTool(t.id) || row.tools.includes(t.id)}
                        disabled={rowIsAdmin || isDefaultTool(t.id) || saving === row.email}
                        onChange={(on) => save(row, toggleTool(row.tools, t.id, on))}
                      />
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
          {rows.length === 0 && <p className="text-base text-gray-500">Nobody matches "{search}".</p>}
        </>
      )}
    </div>
  )
}
