import { describe, expect, it } from 'vitest'

import { createAppStore } from '../../app/store'
import { kbRequestApproved, kbRequestRejected, kbRequestsApproveAll } from './kbSlice'
import {
  selectKbRequestCounts,
  selectKbRequestsByStatus,
  selectPendingKbRequests,
  selectPendingKbRequestsOfAgent,
} from './selectors'

const WORKSPACE = 'weiyun'

describe('kbSlice 與 selectors', () => {
  it('初始為待審 2、已核准 5、已拒絕 1', () => {
    expect(selectKbRequestCounts(createAppStore().getState(), WORKSPACE)).toEqual({
      pending: 2,
      approved: 5,
      rejected: 1,
    })
  })

  it('待審請求依提出時間由新到舊', () => {
    const pending = selectPendingKbRequests(createAppStore().getState(), WORKSPACE)
    expect(pending.map((r) => r.id)).toEqual(['kb-1', 'kb-2'])
  })

  it('kbRequestApproved 把 pending 變成 approved', () => {
    const store = createAppStore()
    store.dispatch(kbRequestApproved({ requestId: 'kb-1' }))
    const counts = selectKbRequestCounts(store.getState(), WORKSPACE)
    expect(counts).toEqual({ pending: 1, approved: 6, rejected: 1 })
  })

  it('kbRequestRejected 把 pending 變成 rejected', () => {
    const store = createAppStore()
    store.dispatch(kbRequestRejected({ requestId: 'kb-2' }))
    expect(
      selectKbRequestsByStatus(store.getState(), WORKSPACE, 'rejected').map((r) => r.id),
    ).toContain('kb-2')
  })

  it('已核准或已拒絕的請求不會再被改變', () => {
    const store = createAppStore()
    store.dispatch(kbRequestRejected({ requestId: 'kb-3' }))
    store.dispatch(kbRequestApproved({ requestId: 'kb-8' }))
    expect(selectKbRequestCounts(store.getState(), WORKSPACE)).toEqual({
      pending: 2,
      approved: 5,
      rejected: 1,
    })
  })

  it('kbRequestsApproveAll 只作用於 pending，不改動已拒絕的請求', () => {
    const store = createAppStore()
    store.dispatch(kbRequestsApproveAll())
    expect(selectKbRequestCounts(store.getState(), WORKSPACE)).toEqual({
      pending: 0,
      approved: 7,
      rejected: 1,
    })
  })

  it('kbRequestsApproveAll 可限定一批 requestIds', () => {
    const store = createAppStore()
    store.dispatch(kbRequestsApproveAll({ requestIds: ['kb-1'] }))
    expect(selectPendingKbRequests(store.getState(), WORKSPACE).map((r) => r.id)).toEqual(['kb-2'])
  })

  it('selectPendingKbRequestsOfAgent 依 Agent 篩選', () => {
    const state = createAppStore().getState()
    expect(selectPendingKbRequestsOfAgent(state, 'passontw-spec').map((r) => r.id)).toEqual([
      'kb-1',
    ])
    expect(selectPendingKbRequestsOfAgent(state, 'passontw-pixel')).toEqual([])
  })
})
