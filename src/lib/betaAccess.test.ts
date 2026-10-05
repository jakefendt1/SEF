import { describe, it, expect } from 'vitest'
import { canSeeTool, isBeta } from './betaAccess'

describe('canSeeTool', () => {
  it('BETA1: a listed email sees the beta tool, in any case', () => {
    expect(canSeeTool('onetrack', 'jacob.fendt@intralox.com')).toBe(true)
    expect(canSeeTool('onetrack', 'Jeremy.Shall@Intralox.com')).toBe(true)
    expect(canSeeTool('onetrack', '  jeremy.shall@intralox.com ')).toBe(true)
  })

  it('BETA2: anyone else does not, and nor does a signed-out user', () => {
    expect(canSeeTool('onetrack', 'someone.else@intralox.com')).toBe(false)
    expect(canSeeTool('onetrack', null)).toBe(false)
    expect(canSeeTool('onetrack', '')).toBe(false)
  })

  it('BETA3: a tool with no entry is visible to everyone', () => {
    expect(canSeeTool('spiral-eval', 'someone.else@intralox.com')).toBe(true)
    expect(canSeeTool('td-bulk-density', null)).toBe(true)
    expect(isBeta('spiral-eval')).toBe(false)
    expect(isBeta('onetrack')).toBe(true)
  })
})
