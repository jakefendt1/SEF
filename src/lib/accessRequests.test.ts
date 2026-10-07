import { describe, it, expect } from 'vitest'
import { openRequests, requestDocId, requestableTools, type AccessRequest } from './accessRequests'

const req = (email: string, toolId: string, at: number): AccessRequest => ({ email, name: '', toolId, note: '', requestedAt: at })

describe('access requests', () => {
  it('R1: one request per person per tool', () => {
    expect(requestDocId('Julia.Leszczuk@Intralox.com', 'onetrack')).toBe('julia.leszczuk@intralox.com__onetrack')
  })

  it('R2: people can ask for what they lack, never for an everyone tool', () => {
    const tools = requestableTools('julia.leszczuk@intralox.com', { tools: ['spiral-eval'] })
    expect(tools).not.toContain('spiral-eval')
    expect(tools).not.toContain('belt-elongation')
    expect(tools).toContain('onetrack')
    expect(requestableTools('jacob.fendt@intralox.com', null)).toEqual([])
  })

  it('R3: the admin list is newest first and drops requests already granted or for removed tools', () => {
    const open = openRequests(
      [req('a@intralox.com', 'onetrack', 1), req('b@intralox.com', 'aim-glide', 3), req('a@intralox.com', 'spiral-eval', 2), req('c@intralox.com', 'gone-tool', 4)],
      [{ email: 'a@intralox.com', tools: ['onetrack'] }],
    )
    expect(open.map((r) => [r.email, r.toolId])).toEqual([
      ['b@intralox.com', 'aim-glide'],
      ['a@intralox.com', 'spiral-eval'],
    ])
  })
})
