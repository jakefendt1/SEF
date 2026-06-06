import type { FormValues } from '../schema/formSchema'

export async function submitToSheets(id: string, data: Partial<FormValues>): Promise<void> {
  const res = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, data }),
  })
  if (!res.ok) {
    throw new Error(`Submit failed: ${res.status}`)
  }
}
