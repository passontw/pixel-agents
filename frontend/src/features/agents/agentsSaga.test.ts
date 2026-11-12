import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppStore } from '../../app/store'
import { MOCK_LAUNCH_DELAY_MS, MOCK_STOP_DELAY_MS } from './agentsSaga'
import { agentLaunchRequested, agentStopRequested } from './agentsSlice'
import { selectAgentById, selectKbWriterOfWorkspace } from './selectors'

describe('agents sagas', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const launchInput = {
    name: 'weiyun-new',
    workspaceId: 'weiyun',
    permissionRoles: ['R' as const, 'E' as const],
    isKbWriter: false,
  }

  it('agentLaunchRequested：先進入 launching，延遲後 agentLaunched 並選取新 Agent', async () => {
    const store = createAppStore()
    store.dispatch(agentLaunchRequested(launchInput))
    expect(store.getState().agents.launch.status).toBe('launching')
    await vi.advanceTimersByTimeAsync(MOCK_LAUNCH_DELAY_MS)
    const { launch, selectedAgentId } = store.getState().agents
    expect(launch).toEqual({ status: 'succeeded', error: null, launchedAgentId: 'weiyun-new' })
    expect(selectedAgentId).toBe('weiyun-new')
    expect(selectAgentById(store.getState(), 'weiyun-new')).toMatchObject({
      workspaceId: 'weiyun',
      status: 'running',
      permissionRoles: ['R', 'E'],
    })
  })

  it('agentLaunchRequested 失敗路徑：名稱重複會 agentLaunchFailed', async () => {
    const store = createAppStore()
    store.dispatch(agentLaunchRequested({ ...launchInput, name: 'passontw-backend' }))
    await vi.advanceTimersByTimeAsync(MOCK_LAUNCH_DELAY_MS)
    const { launch, items } = store.getState().agents
    expect(launch.status).toBe('failed')
    expect(launch.error).toContain('passontw-backend')
    expect(items).toHaveLength(4)
  })

  it('agentLaunchRequested 失敗路徑：找不到工作空間', async () => {
    const store = createAppStore()
    store.dispatch(agentLaunchRequested({ ...launchInput, workspaceId: 'nope' }))
    await vi.advanceTimersByTimeAsync(MOCK_LAUNCH_DELAY_MS)
    expect(store.getState().agents.launch.status).toBe('failed')
  })

  it('啟動時指定 KB Writer 會取代原本的 KB Writer', async () => {
    const store = createAppStore()
    store.dispatch(agentLaunchRequested({ ...launchInput, isKbWriter: true }))
    await vi.advanceTimersByTimeAsync(MOCK_LAUNCH_DELAY_MS)
    expect(selectKbWriterOfWorkspace(store.getState(), 'weiyun')?.id).toBe('weiyun-new')
  })

  it('agentStopRequested：標記停止中，延遲後 agentStopped 變成 idle', async () => {
    const store = createAppStore()
    store.dispatch(agentStopRequested({ agentId: 'passontw-backend' }))
    expect(store.getState().agents.stoppingIds).toEqual(['passontw-backend'])
    await vi.advanceTimersByTimeAsync(MOCK_STOP_DELAY_MS)
    const state = store.getState()
    expect(state.agents.stoppingIds).toEqual([])
    expect(selectAgentById(state, 'passontw-backend')?.status).toBe('idle')
    expect(
      state.agents.details['passontw-backend'].sessionLog.every((e) => e.status === 'done'),
    ).toBe(true)
  })
})
