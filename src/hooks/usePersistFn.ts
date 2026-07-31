import { useRef } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any

/**
 * A stable function identity whose body always sees the latest closure.
 * Used by useComposition (and therefore ui/input) to keep IME handlers from
 * re-subscribing on every render.
 */
export function usePersistFn<T extends AnyFn>(fn: T): T {
  const fnRef = useRef<T>(fn)
  fnRef.current = fn

  const persistFn = useRef<T | null>(null)
  if (!persistFn.current) {
    persistFn.current = function (this: unknown, ...args: Parameters<T>) {
      return fnRef.current.apply(this, args)
    } as T
  }

  return persistFn.current
}
