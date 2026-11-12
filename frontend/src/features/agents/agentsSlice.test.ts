import { describe, expect, it } from 'vitest'

import { createAppStore } from '../../app/store'
import { agentPermissionRolesChanged, agentSelected, kbWriterAssigned } from './agentsSlice'
import {
  selectAgentById,
  selectAgentsOfWorkspace,
  selectKbWriterOfWorkspace,
  selectRoleActivity,
  selectWorkspaceSummary,
} from './selectors'

describe('agentsSlice 與 selectors', () => {
  it('依工作空間篩選 Agent', () => {
    const state = createAppStore().getState()
    expect(selectAgentsOfWorkspace(state, 'weiyun').map((a) => a.id)).toEqual([
      'passontw-backend',
      'passontw-spec',
      'passontw-pixel',
    ])
    expect(selectAgentsOfWorkspace(state, 'personal')).toHaveLength(1)
  })

  it('selectAgentById 找得到與找不到', () => {
    const state = createAppStore().getState()
    expect(selectAgentById(state, 'passontw-spec')?.status).toBe('waiting')
    expect(selectAgentById(state, 'nope')).toBeUndefined()
    expect(selectAgentById(state, undefined)).toBeUndefined()
  })

  it('selectWorkspaceSummary 統計狀態', () => {
    const state = createAppStore().getState()
    expect(selectWorkspaceSummary(state, 'weiyun')).toEqual({
      total: 3,
      running: 1,
      waiting: 1,
      idle: 1,
    })
  })

  it('agentSelected 設定與清除選取', () => {
    const store = createAppStore()
    store.dispatch(agentSelected('passontw-spec'))
    expect(store.getState().agents.selectedAgentId).toBe('passontw-spec')
    store.dispatch(agentSelected(null))
    expect(store.getState().agents.selectedAgentId).toBeNull()
  })

  it('agentPermissionRolesChanged 更新角色並去除重複', () => {
    const store = createAppStore()
    store.dispatch(
      agentPermissionRolesChanged({ agentId: 'passontw-spec', roles: ['R', 'E', 'E'] }),
    )
    expect(selectAgentById(store.getState(), 'passontw-spec')?.permissionRoles).toEqual(['R', 'E'])
  })

  it('kbWriterAssigned 每個工作空間只能有一位 KB Writer，新的會取消舊的', () => {
    const store = createAppStore()
    expect(selectKbWriterOfWorkspace(store.getState(), 'weiyun')?.id).toBe('passontw-pixel')
    store.dispatch(kbWriterAssigned({ agentId: 'passontw-backend' }))
    const writers = selectAgentsOfWorkspace(store.getState(), 'weiyun').filter((a) => a.isKbWriter)
    expect(writers.map((a) => a.id)).toEqual(['passontw-backend'])
  })

  it('kbWriterAssigned 不影響其他工作空間的 KB Writer', () => {
    const store = createAppStore()
    store.dispatch(kbWriterAssigned({ agentId: 'personal-notes' }))
    expect(selectKbWriterOfWorkspace(store.getState(), 'personal')?.id).toBe('personal-notes')
    expect(selectKbWriterOfWorkspace(store.getState(), 'weiyun')?.id).toBe('passontw-pixel')
  })

  it('Role Activity 由 Session Log 依 Auto Role 分組', () => {
    const groups = selectRoleActivity(createAppStore().getState(), 'passontw-backend')
    expect(groups.map((g) => [g.role, g.entries.length])).toEqual([
      ['R', 3],
      ['E', 1],
    ])
  })
})
