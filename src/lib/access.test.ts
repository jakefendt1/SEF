import { describe, it, expect } from 'vitest'
import { ADMIN_EMAILS, ALL_TOOL_IDS, TOOL_COLLECTIONS, accessDocId, adminRows, canUse, isAdmin, toggleTool, toolsFor } from './access'
import { TOOLS } from './navigation'

describe('access', () => {
  it('A1: someone with no grant gets no tools', () => {
    expect(toolsFor('new.person@intralox.com', null)).toEqual([])
    expect(canUse('spiral-eval', 'new.person@intralox.com', null)).toBe(false)
    expect(toolsFor(null, null)).toEqual([])
  })

  it('A2: a grant opens exactly its tools, in dashboard order, ignoring unknown ids', () => {
    const grant = { tools: ['onetrack', 'retired-tool', 'spiral-eval'] }
    expect(toolsFor('someone@intralox.com', grant)).toEqual(['spiral-eval', 'onetrack'])
    expect(canUse('aim-glide', 'someone@intralox.com', grant)).toBe(false)
  })

  it('A3: admins get every tool, whatever their grant says, in any case', () => {
    expect(isAdmin('Jacob.Fendt@Intralox.com')).toBe(true)
    expect(toolsFor('jacob.fendt@intralox.com', null)).toEqual(ALL_TOOL_IDS)
    expect(isAdmin('someone@intralox.com')).toBe(false)
  })

  it('A4: every tool on the dashboard gets a switch; every data collection belongs to a real tool', () => {
    expect(ALL_TOOL_IDS).toEqual(TOOLS.map((t) => t.id))
    for (const id of Object.keys(TOOL_COLLECTIONS)) expect(ALL_TOOL_IDS).toContain(id)
  })

  it('A5: grants are keyed by the lower-cased email', () => {
    expect(accessDocId(' Jeremy.Shall@Intralox.com ')).toBe('jeremy.shall@intralox.com')
  })

  it('A6: toggling keeps dashboard order and never duplicates', () => {
    expect(toggleTool(['onetrack'], 'spiral-eval', true)).toEqual(['spiral-eval', 'onetrack'])
    expect(toggleTool(['spiral-eval', 'onetrack'], 'spiral-eval', true)).toEqual(['spiral-eval', 'onetrack'])
    expect(toggleTool(['spiral-eval', 'onetrack'], 'onetrack', false)).toEqual(['spiral-eval'])
  })

  it('A7: the admin list merges sign-ups with pre-approved emails, searchable by name or email', () => {
    const profiles = [
      { email: 'Jeremy.Shall@intralox.com', displayName: 'Jeremy Shall' },
      { email: 'jacob.fendt@intralox.com', displayName: 'Jake Fendt' },
    ]
    const grants = [
      { email: 'jeremy.shall@intralox.com', tools: ['onetrack'] },
      { email: 'new.hire@intralox.com', tools: ['belt-elongation'] },
    ]
    const rows = adminRows(profiles, grants)
    expect(rows.map((r) => [r.email, r.signedUp, r.tools])).toEqual([
      ['jacob.fendt@intralox.com', true, []],
      ['jeremy.shall@intralox.com', true, ['onetrack']],
      ['new.hire@intralox.com', false, ['belt-elongation']],
    ])
    expect(adminRows(profiles, grants, 'jer').map((r) => r.email)).toEqual(['jeremy.shall@intralox.com'])
    expect(adminRows(profiles, grants, 'NEW.HIRE').map((r) => r.email)).toEqual(['new.hire@intralox.com'])
    expect(adminRows(profiles, grants, 'fendt').map((r) => r.name)).toEqual(['Jake Fendt'])
  })

  it('A8: the admin list in the rules matches the app', async () => {
    // firestore.rules can't import TypeScript; this keeps the two lists honest.
    const rules = (await import('../../firestore.rules?raw')).default as string
    for (const email of ADMIN_EMAILS) expect(rules).toContain(`'${email}'`)
    for (const [tool] of Object.entries(TOOL_COLLECTIONS)) expect(rules).toContain(`hasTool('${tool}')`)
  })
})
