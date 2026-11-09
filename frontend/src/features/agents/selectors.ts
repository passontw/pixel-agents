import { createSelector } from '@reduxjs/toolkit'

import type { Agent, AgentDetails } from '../../domain/types'
import { EMPTY_AGENT_DETAILS } from '../../mocks/sessions'
import type { AgentsState } from './agentsSlice'

type StateWithAgents = { agents: AgentsState }

export const selectAgents = (state: StateWithAgents) => state.agents.items
export const selectSelectedAgentId = (state: StateWithAgents) => state.agents.selectedAgentId
export const selectLaunchState = (state: StateWithAgents) => state.agents.launch
export const selectStoppingIds = (state: StateWithAgents) => state.agents.stoppingIds

export const selectAgentById = (state: StateWithAgents, agentId: string | undefined) =>
  agentId ? state.agents.items.find((agent) => agent.id === agentId) : undefined

export const selectAgentsOfWorkspace = createSelector(
  [selectAgents, (_state: StateWithAgents, workspaceId: string) => workspaceId],
  (agents, workspaceId) => agents.filter((agent) => agent.workspaceId === workspaceId),
)

export const selectKbWriterOfWorkspace = (
  state: StateWithAgents,
  workspaceId: string,
): Agent | undefined =>
  state.agents.items.find((agent) => agent.workspaceId === workspaceId && agent.isKbWriter)

export const selectAgentDetails = (
  state: StateWithAgents,
  agentId: string | undefined,
): AgentDetails => (agentId && state.agents.details[agentId]) || EMPTY_AGENT_DETAILS

export interface RoleActivityGroup {
  role: 'R' | 'E' | 'D'
  entries: AgentDetails['sessionLog']
}

/** Role Activity：把 Session Log 依 Auto Role 分組（由 session log 推導，不另存）。 */
export const selectRoleActivity = createSelector([selectAgentDetails], (details) =>
  (['R', 'E', 'D'] as const)
    .map((role) => ({ role, entries: details.sessionLog.filter((e) => e.autoRole === role) }))
    .filter((group) => group.entries.length > 0),
)

export interface WorkspaceSummary {
  total: number
  running: number
  waiting: number
  idle: number
}

export const selectWorkspaceSummary = createSelector([selectAgentsOfWorkspace], (agents) => ({
  total: agents.length,
  running: agents.filter((agent) => agent.status === 'running').length,
  waiting: agents.filter((agent) => agent.status === 'waiting').length,
  idle: agents.filter((agent) => agent.status === 'idle').length,
}))
