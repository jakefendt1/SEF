import { Link } from 'wouter'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'

interface ToolCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
}

export function ToolCard({ title, description, icon: Icon, href }: ToolCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition-shadow hover:shadow-md hover:border-primary/40 active:bg-accent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary shrink-0">
              <Icon className="size-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-base text-muted-foreground">{description}</p>
          {/* Always visible: a hover-only affordance is permanently invisible
              on the iPads these get used on. */}
          <p className="mt-4 text-base font-semibold text-primary flex items-center gap-1">
            Open <ArrowRight className="size-4" aria-hidden="true" />
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
