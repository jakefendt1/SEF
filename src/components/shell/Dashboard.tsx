import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'
import { TOOLS } from '../../lib/navigation'
import { isBeta } from '../../lib/betaAccess'
import { ROUTES } from '../../lib/navigation'
import { buildRequest, openRequests, type AccessRequest } from '../../lib/accessRequests'
import { subscribeAllAccess } from '../../lib/firestoreAccess'
import { deleteRequest, putRequest, subscribeAllRequests, subscribeMyRequests } from '../../lib/firestoreAccessRequests'
import { raceWrite, WRITE_MESSAGES } from '../../lib/writeOutcome'
import type { AccessGrant } from '../../lib/access'
import { ShieldCheck } from 'lucide-react'
import { useMyTools } from '../../store/useMyTools'
import { ToolCard } from './ToolCard'
import { LockedToolCard } from './LockedToolCard'
import { RequestAccessDialog } from './RequestAccessDialog'
import { RecentActivity } from './RecentActivity'

function firstName(displayName: string | undefined): string {
  if (!displayName) return ''
  return displayName.trim().split(/\s+/)[0] ?? ''
}

/** Admin only: how many requests are waiting, for the Manage access card. */
function useOpenRequestCount(admin: boolean): number {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [grants, setGrants] = useState<AccessGrant[]>([])
  useEffect(() => {
    if (!admin) return
    const a = subscribeAllRequests(setRequests)
    const b = subscribeAllAccess(setGrants)
    return () => {
      a()
      b()
    }
  }, [admin])
  return admin ? openRequests(requests, grants).length : 0
}

export function Dashboard() {
  const profile = useAuthStore((s) => s.profile)
  const email = useAuthStore((s) => s.user?.email ?? null)
  const { tools, loaded, admin } = useMyTools()
  const name = firstName(profile?.displayName)
  const [myRequests, setMyRequests] = useState<AccessRequest[]>([])
  const [asking, setAsking] = useState<{ id: string; title: string } | null>(null)
  const [sending, setSending] = useState(false)
  const waiting = useOpenRequestCount(admin)

  useEffect(() => {
    if (!email || admin) return
    return subscribeMyRequests(email, setMyRequests, () => setMyRequests([]))
  }, [email, admin])

  const requested = new Set(myRequests.map((r) => r.toolId))
  // Your tools first, then the ones you can ask for, each in TOOLS order.
  const ordered = [...TOOLS.filter((t) => tools.includes(t.id)), ...TOOLS.filter((t) => !tools.includes(t.id))]

  const send = async (note: string) => {
    if (!email || !asking) return
    setSending(true)
    const { outcome, settled } = await raceWrite(
      putRequest(buildRequest(email, profile?.displayName ?? '', asking.id, note, Date.now())),
    )
    setSending(false)
    if (outcome.kind === 'failed') {
      toast.error(`Didn't send. ${outcome.message}`)
      return
    }
    if (outcome.kind === 'saved') toast.success(`Requested ${asking.title}. It shows up here once it's approved.`)
    else {
      toast(WRITE_MESSAGES.queued)
      void settled.then((o) => {
        if (o.kind === 'failed') toast.error(`${WRITE_MESSAGES.lateFailed} ${o.message}`)
      })
    }
    setAsking(null)
  }

  const cancel = async (toolId: string) => {
    if (!email) return
    const { outcome } = await raceWrite(deleteRequest(email, toolId))
    if (outcome.kind === 'failed') toast.error(`Didn't cancel. ${outcome.message}`)
    else toast('Request cancelled')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">
        {name ? `Welcome back, ${name}` : 'Welcome back'}
      </h2>
      <p className="text-base text-gray-600 mb-6">Pick a tool to get started.</p>

      {!loaded ? (
        <p className="text-base text-gray-500">Loading your tools…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ordered.map((tool) =>
            tools.includes(tool.id) ? (
              <ToolCard
                key={tool.id}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                href={tool.href}
                beta={isBeta(tool.id)}
              />
            ) : (
              <LockedToolCard
                key={tool.id}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                requested={requested.has(tool.id)}
                onRequest={() => setAsking({ id: tool.id, title: tool.title })}
                onCancel={() => void cancel(tool.id)}
              />
            ),
          )}
        </div>
      )}

      {admin && (
        <div className="mt-4">
          <ToolCard
            title={waiting > 0 ? `Manage access · ${waiting} waiting` : 'Manage access'}
            description={
              waiting > 0
                ? `${waiting} access request${waiting === 1 ? '' : 's'} to approve or decline.`
                : "See everyone who's signed up and choose which tools each person can use."
            }
            icon={ShieldCheck}
            href={ROUTES.admin}
          />
        </div>
      )}

      <RecentActivity />

      <RequestAccessDialog
        tool={asking?.title ?? null}
        sending={sending}
        onOpenChange={(open) => !open && setAsking(null)}
        onSend={(note) => void send(note)}
      />
    </div>
  )
}
