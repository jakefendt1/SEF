import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reloadOnServiceWorkerUpdate } from './swUpdate'

function setup({ controller }: { controller: object | null }) {
  const listeners: Record<string, (() => void)[]> = {}
  const reload = vi.fn()

  vi.stubGlobal('navigator', {
    serviceWorker: {
      controller,
      addEventListener: (type: string, fn: () => void) => {
        ;(listeners[type] ??= []).push(fn)
      },
    },
  })
  vi.stubGlobal('window', { location: { reload } })

  return { fire: (type: string) => listeners[type]?.forEach((f) => f()), reload }
}

beforeEach(() => vi.unstubAllGlobals())
afterEach(() => vi.unstubAllGlobals())

describe('reloadOnServiceWorkerUpdate', () => {
  it('reloads when a new worker takes over from an existing one', () => {
    const { fire, reload } = setup({ controller: {} })
    reloadOnServiceWorkerUpdate()
    fire('controllerchange')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  // First-ever visit: the worker claiming the page is normal startup. Reloading
  // there is a pointless flash at best, and on a slow connection a loop.
  it('does not reload on a first visit, when there was no controller yet', () => {
    const { fire, reload } = setup({ controller: null })
    reloadOnServiceWorkerUpdate()
    fire('controllerchange')
    expect(reload).not.toHaveBeenCalled()
  })

  it('reloads at most once even if the event fires repeatedly', () => {
    const { fire, reload } = setup({ controller: {} })
    reloadOnServiceWorkerUpdate()
    fire('controllerchange')
    fire('controllerchange')
    fire('controllerchange')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('does nothing in an environment with no service worker support', () => {
    vi.stubGlobal('navigator', {})
    expect(() => reloadOnServiceWorkerUpdate()).not.toThrow()
  })

  it('does nothing when there is no navigator at all', () => {
    vi.stubGlobal('navigator', undefined)
    expect(() => reloadOnServiceWorkerUpdate()).not.toThrow()
  })
})
