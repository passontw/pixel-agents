import type { PayloadAction } from '@reduxjs/toolkit'
import { delay, put, select, takeEvery, takeLatest } from 'redux-saga/effects'

import type { Agent } from '../../domain/types'
import { selectWorkspaceById } from '../workspaces/workspacesSlice'
import type { WorkspacesState } from '../workspaces/workspacesSlice'
import {
  agentLaunched,
  agentLaunchFailed,
  agentLaunchRequested,
  agentStopped,
  agentStopRequested,
} from './agentsSlice'
import type { AgentsState, LaunchInput } from './agentsSlice'

/** 模擬啟動與停止的延遲；後端第一階段尚未提供對應 API。 */
export const MOCK_LAUNCH_DELAY_MS = 800
export const MOCK_STOP_DELAY_MS = 500

type SagaState = { agents: AgentsState; workspaces: WorkspacesState }

export function* launchAgent(action: PayloadAction<LaunchInput>) {
  const input = action.payload
  yield delay(MOCK_LAUNCH_DELAY_MS)
  const state: SagaState = yield select()
  const workspace = selectWorkspaceById(state, input.workspaceId)
  if (!workspace) {
    yield put(agentLaunchFailed('找不到指定的工作空間'))
    return
  }
  if (state.agents.items.some((agent) => agent.name === input.name)) {
    yield put(agentLaunchFailed(`名稱「${input.name}」已被使用`))
    return
  }
  const now = Date.now()
  const agent: Agent = {
    id: input.name,
    name: input.name,
    workspaceId: input.workspaceId,
    cwd: workspace.path,
    status: 'running',
    startedAt: now,
    lastActiveAt: now,
    branch: 'main',
    permissionRoles: input.permissionRoles,
    isKbWriter: input.isKbWriter,
  }
  yield put(agentLaunched(agent))
}

export function* stopAgent(action: PayloadAction<{ agentId: string }>) {
  yield delay(MOCK_STOP_DELAY_MS)
  yield put(agentStopped({ agentId: action.payload.agentId, stoppedAt: Date.now() }))
}

export function* agentsSaga() {
  yield takeLatest(agentLaunchRequested.type, launchAgent)
  yield takeEvery(agentStopRequested.type, stopAgent)
}
