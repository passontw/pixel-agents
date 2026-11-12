import { createSelector } from '@reduxjs/toolkit'

import type { Agent, KbRequest, KbRequestStatus } from '../../domain/types'
import type { AgentsState } from '../agents/agentsSlice'
import type { KbState } from './kbSlice'

type StateWithKb = { kb: KbState; agents: AgentsState }

const selectRequests = (state: StateWithKb) => state.kb.requests
const selectAgentItems = (state: StateWithKb) => state.agents.items
const workspaceIdArg = (_state: StateWithKb, workspaceId: string) => workspaceId

const agentsById = (agents: Agent[]) => new Map(agents.map((agent) => [agent.id, agent]))

/** 某工作空間內、依提出時間由新到舊排序的請求，可依狀態篩選。 */
export const selectKbRequestsOfWorkspace = createSelector(
  [selectRequests, selectAgentItems, workspaceIdArg],
  (requests, agents, workspaceId): KbRequest[] => {
    const byId = agentsById(agents)
    return requests
      .filter((request) => byId.get(request.agentId)?.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt - a.createdAt)
  },
)

export const selectKbRequestsByStatus = (
  state: StateWithKb,
  workspaceId: string,
  status: KbRequestStatus,
) => selectKbRequestsOfWorkspace(state, workspaceId).filter((request) => request.status === status)

export const selectPendingKbRequests = createSelector([selectKbRequestsOfWorkspace], (requests) =>
  requests.filter((request) => request.status === 'pending'),
)

export const selectPendingKbRequestsOfAgent = (state: StateWithKb, agentId: string | undefined) =>
  state.kb.requests.filter((request) => request.agentId === agentId && request.status === 'pending')

export const selectKbRequestCounts = createSelector([selectKbRequestsOfWorkspace], (requests) => ({
  pending: requests.filter((request) => request.status === 'pending').length,
  approved: requests.filter((request) => request.status === 'approved').length,
  rejected: requests.filter((request) => request.status === 'rejected').length,
}))
