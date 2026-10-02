/** A large, touch-friendly range input for moving a section cut. */
export function CutSlider({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: number
  onChange: (fraction: number) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground/80">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={1000}
        value={Math.round(value * 1000)}
        onChange={(e) => onChange(Number(e.target.value) / 1000)}
        className="w-full h-12 accent-[var(--brand)] cursor-pointer"
      />
    </div>
  )
}
