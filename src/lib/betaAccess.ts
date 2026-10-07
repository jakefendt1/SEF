// Tools still in beta show a "Beta" chip on their card. Who can open a tool
// at all is the access grant (lib/access.ts, Manage access), not this list.
//
// Launching a tool = deleting its id here and pushing.

export const BETA_TOOL_IDS: readonly string[] = ['onetrack']

export function isBeta(toolId: string): boolean {
  return BETA_TOOL_IDS.includes(toolId)
}
