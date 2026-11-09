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

/** KB 審核頁的分頁以查詢參數 ?tab= 表示，預設為待審核。 */
export const KB_TABS = [
  { value: 'pending', label: '待審核' },
  { value: 'approved', label: '已核准' },
  { value: 'rejected', label: '已拒絕' },
] as const

export type KbTabValue = (typeof KB_TABS)[number]['value']
export const DEFAULT_KB_TAB: KbTabValue = 'pending'
export const KB_TAB_PARAM = 'tab'
