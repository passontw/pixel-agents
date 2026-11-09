export const paths = {
  dashboard: '/',
  newAgent: '/agents/new',
  agent: (agentId: string) => `/agents/${agentId}`,
  agentLog: (agentId: string) => `/agents/${agentId}/log`,
  agentFiles: (agentId: string) => `/agents/${agentId}/files`,
  agentRoles: (agentId: string) => `/agents/${agentId}/roles`,
  terminal: (agentId: string) => `/agents/${agentId}/terminal`,
  kbReview: '/kb/review',
  styleGuide: '/style-guide',
} as const

/** react-router 的路由樣式（相對於父層的 path）。 */
export const routePatterns = {
  newAgent: 'agents/new',
  agent: 'agents/:agentId',
  terminal: 'agents/:agentId/terminal',
  kbReview: 'kb/review',
  styleGuide: 'style-guide',
} as const

export const AGENT_TABS = [
  { value: 'log', label: 'Session Log' },
  { value: 'files', label: 'Files Changed' },
  { value: 'roles', label: 'Role Activity' },
] as const

export type AgentTabValue = (typeof AGENT_TABS)[number]['value']
