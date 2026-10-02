// What actually happened to a Firestore write, in terms a rep can act on.
//
// With the persistent local cache, a write lands on the device at once but
// its promise only resolves when the server has it -- offline, it stays
// pending. So "saved" is only claimed once the server confirms; a write still
// pending after a short wait is reported as "on this device, not sent yet";
// and a rejected write is reported as not saved. Never a success that didn't
// happen.

export type WriteOutcome =
  | { kind: 'saved' }
  | { kind: 'queued' }
  | { kind: 'failed'; message: string }

export const QUEUED_AFTER_MS = 4000

export function describeError(err: unknown): string {
  const code = (err as { code?: string } | null)?.code
  if (code === 'permission-denied') return "Your account isn't allowed to save this. Nothing was saved."
  if (code === 'unavailable') return "Couldn't reach the server. Nothing was saved."
  return err instanceof Error ? err.message : String(err)
}

export async function raceWrite(
  write: Promise<void>,
  ms = QUEUED_AFTER_MS,
): Promise<{ outcome: WriteOutcome; settled: Promise<WriteOutcome> }> {
  const settled: Promise<WriteOutcome> = write.then(
    () => ({ kind: 'saved' }) as const,
    (err) => ({ kind: 'failed', message: describeError(err) }) as const,
  )
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<WriteOutcome>((resolve) => {
    timer = setTimeout(() => resolve({ kind: 'queued' }), ms)
  })
  const outcome = await Promise.race([settled, timeout])
  clearTimeout(timer)
  return { outcome, settled }
}

/** The words for each outcome. One home, like lib/statusLabels. */
export const WRITE_MESSAGES = {
  saved: 'Saved to your account',
  queued: "Saved on this device, not sent yet — it goes to your account when you're back online",
  lateFailed: "Didn't save. The server turned it down after all:",
  deleted: 'Deleted',
  deleteQueued: "Deleted on this device — your account updates when you're back online",
} as const
