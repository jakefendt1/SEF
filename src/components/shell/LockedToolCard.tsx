// A tool you don't have yet: greyed out, with a lock, and a way to ask for it.
// The request lands on the admin's Manage access page (no email involved).
import type { LucideIcon } from 'lucide-react'
import { Clock, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LockedToolCardProps {
  title: string
  description: string
  icon: LucideIcon
  /** True once a request for this tool is waiting. */
  requested: boolean
  onRequest: () => void
  onCancel: () => void
}

export function LockedToolCard({ title, description, icon: Icon, requested, onRequest, onCancel }: LockedToolCardProps) {
  return (
    <Card className="h-full bg-gray-50 border-dashed">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-lg bg-gray-200 text-gray-500 shrink-0">
            <Icon className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-lg text-gray-500">{title}</CardTitle>
          <Lock className="ml-auto size-5 shrink-0 text-gray-400" aria-label="Not turned on for you" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-base text-gray-500">{description}</p>
        {requested ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-base font-semibold text-gray-700 flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" /> Requested — waiting for approval
            </p>
            <button type="button" onClick={onCancel} className="min-h-[44px] text-base text-gray-600 underline">
              Cancel request
            </button>
          </div>
        ) : (
          <Button variant="outline" className="mt-3 min-h-[48px] text-base" onClick={onRequest}>
            Request access
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
