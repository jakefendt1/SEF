import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, Ruler } from 'lucide-react'
import { MeasureDiagram } from './MeasureDiagram'
import { RulerReference } from './RulerReference'

interface Props {
  /** Pitches this series needs for a reliable reading, if a pitch is known. */
  recommendedPitches: number | null
}

/**
 * The part of this tool that isn't arithmetic.
 *
 * An elongation number is only as good as the span it came from, and the ways
 * to get that wrong -- slack belt, miscounted pitches, reading a different
 * feature at each end, measuring six inches of belt -- are all invisible in
 * the result. So they're taught here rather than left to a footnote.
 */
export function MeasureGuide({ recommendedPitches }: Props) {
  return (
    <Card id="how-to-measure" className="scroll-mt-36">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Ruler className="size-5 text-primary" aria-hidden="true" />
          How to measure it with a tape
        </CardTitle>
        <CardDescription>
          No elongation ruler needed. Count pitches, measure the span, read the number.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <MeasureDiagram />

        <ol className="space-y-4">
          {[
            {
              title: 'Get the span under normal tension first',
              body: 'Run the belt, then stop it. A slack belt measures short, which reads as a belt that has not grown — the one mistake that makes a worn belt look fine.',
            },
            {
              title: 'Hook your tape on a hinge rod',
              body: 'Pick a feature and use the same one at both ends: the leading edge of the rod at the start, the leading edge of the rod at the finish. Measure on a straight, flat run of belt — not around a sprocket and not in the take-up.',
            },
            {
              title: 'Count the pitches, not the rods',
              body: recommendedPitches
                ? `One pitch is one module row, rod to rod. For this series, count at least ${recommendedPitches} pitches — roughly two feet of belt. Short spans are the problem: over three pitches, a sixteenth of an inch of tape error can look like several percent of elongation.`
                : 'One pitch is one module row, rod to rod. Count enough of them to span roughly two feet of belt. Over a short span, a sixteenth of an inch of tape error can look like several percent of elongation.',
            },
            {
              title: 'Read the tape to the nearest sixteenth',
              body: 'Type the whole inches and pick the fraction — no decimal conversion, no mental arithmetic on a plant floor.',
            },
            {
              title: 'Do it again somewhere else on the belt',
              body: 'Two or three readings in different places get averaged. If they disagree by more than about an eighth of an inch, a pitch got miscounted — the tool will say so.',
            },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span
                className="flex items-center justify-center size-8 shrink-0 rounded-full bg-brand text-white font-semibold text-base font-mono-num"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  <span className="sr-only">Step {i + 1}. </span>
                  {step.title}
                </p>
                <p className="text-base text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* A details/summary rather than a toggle button: it works with no
            JavaScript state, and there is no hover affordance to miss. */}
        <details className="group rounded-xl border border-border bg-secondary/40">
          <summary className="flex items-center gap-2 min-h-[48px] px-4 py-2 font-semibold text-brand list-none [&::-webkit-details-marker]:hidden">
            <ChevronDown
              className="size-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
              aria-hidden="true"
            />
            Which mark is which? Tape measure reference
          </summary>
          <div className="px-4 pb-5 pt-1">
            <RulerReference />
          </div>
        </details>
      </CardContent>
    </Card>
  )
}
