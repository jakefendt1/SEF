// "Request access" for a greyed-out tool, with an optional note for the admin.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { NOTE_MAX } from '@/lib/accessRequests'

export function RequestAccessDialog({
  tool,
  sending,
  onOpenChange,
  onSend,
}: {
  /** The tool's title; null closes the dialog. */
  tool: string | null
  sending: boolean
  onOpenChange: (open: boolean) => void
  onSend: (note: string) => void
}) {
  const [note, setNote] = useState('')
  return (
    <Dialog
      open={tool !== null}
      onOpenChange={(open) => {
        if (!open) setNote('')
        onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request {tool}</DialogTitle>
          <DialogDescription>
            Your request goes to the hub admin. The tool appears on your home screen as soon as it's turned on.
          </DialogDescription>
        </DialogHeader>
        <div>
          <label htmlFor="request-note" className="block text-sm font-medium text-foreground/80 mb-1">
            Note (optional)
          </label>
          <textarea
            id="request-note"
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. For the Pepsico visit next week"
            className="w-full px-4 py-3 rounded-lg border border-gray-400 text-base bg-white"
          />
        </div>
        <DialogFooter>
          <Button
            className="min-h-[48px] text-base bg-brand hover:bg-brand-hover"
            disabled={sending}
            onClick={() => {
              onSend(note)
              setNote('')
            }}
          >
            {sending ? 'Sending…' : 'Send request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
