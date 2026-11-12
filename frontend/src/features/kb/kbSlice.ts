import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import type { KbRequest, KbRequestStatus } from '../../domain/types'
import { mockKbRequests } from '../../mocks/kbRequests'

// 後端尚未提供：KB 寫入請求的提出、審核與寫入。此 slice 只是設計稿的前端實作，
// 資料來自 mocks/，操作只改前端狀態。
export interface KbState {
  requests: KbRequest[]
}

const initialState: KbState = { requests: mockKbRequests }

function resolvePending(state: KbState, requestId: string, status: KbRequestStatus) {
  const request = state.requests.find((item) => item.id === requestId)
  if (request?.status === 'pending') request.status = status
}

const kbSlice = createSlice({
  name: 'kb',
  initialState,
  reducers: {
    kbRequestApproved(state, action: PayloadAction<{ requestId: string }>) {
      resolvePending(state, action.payload.requestId, 'approved')
    },
    kbRequestRejected(state, action: PayloadAction<{ requestId: string }>) {
      resolvePending(state, action.payload.requestId, 'rejected')
    },
    /** 只作用於 pending；可限定在一批 requestIds（例如目前工作空間）。 */
    kbRequestsApproveAll(state, action: PayloadAction<{ requestIds?: string[] } | undefined>) {
      const only = action.payload?.requestIds
      for (const request of state.requests) {
        if (request.status === 'pending' && (!only || only.includes(request.id))) {
          request.status = 'approved'
        }
      }
    },
  },
})

export const { kbRequestApproved, kbRequestRejected, kbRequestsApproveAll } = kbSlice.actions
export const kbReducer = kbSlice.reducer
