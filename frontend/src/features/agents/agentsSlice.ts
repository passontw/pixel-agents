import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import type { Agent, AgentDetails, PermissionRole } from '../../domain/types'
import { mockAgents } from '../../mocks/agents'
import { mockAgentDetails } from '../../mocks/sessions'

export interface LaunchInput {
  name: string
  workspaceId: string
  permissionRoles: PermissionRole[]
  isKbWriter: boolean
}

export type LaunchStatus = 'idle' | 'launching' | 'succeeded' | 'failed'

export interface AgentsState {
  items: Agent[]
  details: Record<string, AgentDetails>
  selectedAgentId: string | null
  launch: { status: LaunchStatus; error: string | null; launchedAgentId: string | null }
  /** 已送出 Stop、等待結果的 Agent */
  stoppingIds: string[]
}

const initialState: AgentsState = {
  items: mockAgents,
  details: mockAgentDetails,
  selectedAgentId: null,
  launch: { status: 'idle', error: null, launchedAgentId: null },
  stoppingIds: [],
}

/** 每個工作空間只能有一位 KB Writer：指派新的會取消同工作空間的舊 Writer。 */
function assignKbWriter(items: Agent[], agentId: string) {
  const target = items.find((agent) => agent.id === agentId)
  if (!target) return
  for (const agent of items) {
    if (agent.workspaceId === target.workspaceId) agent.isKbWriter = agent.id === agentId
  }
}

const agentsSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {
    agentSelected(state, action: PayloadAction<string | null>) {
      state.selectedAgentId = action.payload
    },
    agentLaunchRequested(state, _action: PayloadAction<LaunchInput>) {
      state.launch = { status: 'launching', error: null, launchedAgentId: null }
    },
    agentLaunched(state, action: PayloadAction<Agent>) {
      state.items.push(action.payload)
      state.details[action.payload.id] = { sessionLog: [], filesChanged: [] }
      if (action.payload.isKbWriter) assignKbWriter(state.items, action.payload.id)
      state.selectedAgentId = action.payload.id
      state.launch = { status: 'succeeded', error: null, launchedAgentId: action.payload.id }
    },
    agentLaunchFailed(state, action: PayloadAction<string>) {
      state.launch = { status: 'failed', error: action.payload, launchedAgentId: null }
    },
    agentLaunchReset(state) {
      state.launch = { status: 'idle', error: null, launchedAgentId: null }
    },
    agentStopRequested(state, action: PayloadAction<{ agentId: string }>) {
      if (!state.stoppingIds.includes(action.payload.agentId)) {
        state.stoppingIds.push(action.payload.agentId)
      }
    },
    agentStopped(state, action: PayloadAction<{ agentId: string; stoppedAt: number }>) {
      state.stoppingIds = state.stoppingIds.filter((id) => id !== action.payload.agentId)
      const agent = state.items.find((item) => item.id === action.payload.agentId)
      if (!agent) return
      agent.status = 'idle'
      agent.lastActiveAt = action.payload.stoppedAt
      const log = state.details[agent.id]?.sessionLog ?? []
      for (const entry of log) entry.status = 'done'
    },
    agentPermissionRolesChanged(
      state,
      action: PayloadAction<{ agentId: string; roles: PermissionRole[] }>,
    ) {
      const agent = state.items.find((item) => item.id === action.payload.agentId)
      if (agent) agent.permissionRoles = [...new Set(action.payload.roles)]
    },
    kbWriterAssigned(state, action: PayloadAction<{ agentId: string }>) {
      assignKbWriter(state.items, action.payload.agentId)
    },
  },
})

export const {
  agentSelected,
  agentLaunchRequested,
  agentLaunched,
  agentLaunchFailed,
  agentLaunchReset,
  agentStopRequested,
  agentStopped,
  agentPermissionRolesChanged,
  kbWriterAssigned,
} = agentsSlice.actions
export const agentsReducer = agentsSlice.reducer
