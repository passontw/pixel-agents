import { describe, expect, it } from 'vitest'

import { createAppStore } from '../../app/store'
import {
  selectSelectedWorkspace,
  selectWorkspaces,
  workspaceAdded,
  workspaceSelected,
} from './workspacesSlice'

describe('workspacesSlice', () => {
  it('預設選取 weiyun，並有 weiyun 與 personal 兩個工作空間', () => {
    const state = createAppStore().getState()
    expect(selectWorkspaces(state).map((w) => w.id)).toEqual(['weiyun', 'personal'])
    expect(selectSelectedWorkspace(state)?.name).toBe('weiyun')
  })

  it('workspaceSelected 切換工作空間，未知的 id 會被忽略', () => {
    const store = createAppStore()
    store.dispatch(workspaceSelected('personal'))
    expect(selectSelectedWorkspace(store.getState())?.id).toBe('personal')
    store.dispatch(workspaceSelected('nope'))
    expect(selectSelectedWorkspace(store.getState())?.id).toBe('personal')
  })

  it('workspaceAdded 新增並選取，kbPath 由 path 推導', () => {
    const store = createAppStore()
    store.dispatch(workspaceAdded({ name: 'New One', path: '~/new' }))
    const added = selectSelectedWorkspace(store.getState())
    expect(added).toEqual({
      id: 'new-one',
      name: 'New One',
      path: '~/new/',
      kbPath: '~/new/.note/',
    })
  })

  it('workspaceAdded 不會重複新增相同 id', () => {
    const store = createAppStore()
    store.dispatch(workspaceAdded({ name: 'weiyun', path: '~/other' }))
    expect(selectWorkspaces(store.getState())).toHaveLength(2)
  })
})
