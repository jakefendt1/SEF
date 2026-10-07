import { describe, it, expect } from 'vitest'
import { isBeta } from './betaAccess'

describe('isBeta', () => {
  it('labels OneTrack as beta and nothing else', () => {
    expect(isBeta('onetrack')).toBe(true)
    expect(isBeta('spiral-eval')).toBe(false)
  })
})
