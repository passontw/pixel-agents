import { createSelector, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import type { Workspace } from '../../domain/types'
import { MOCK_DEFAULT_WORKSPACE_ID, mockWorkspaces } from '../../mocks/workspaces'

export interface WorkspacesState {
  items: Workspace[]
  selectedWorkspaceId: string
}

const initialState: WorkspacesState = {
  items: mockWorkspaces,
  selectedWorkspaceId: MOCK_DEFAULT_WORKSPACE_ID,
}

const toWorkspaceId = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '-')

const workspacesSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    workspaceSelected(state, action: PayloadAction<string>) {
      if (state.items.some((workspace) => workspace.id === action.payload)) {
        state.selectedWorkspaceId = action.payload
      }
    },
    workspaceAdded: {
      reducer(state, action: PayloadAction<Workspace>) {
        if (state.items.some((workspace) => workspace.id === action.payload.id)) return
        state.items.push(action.payload)
        state.selectedWorkspaceId = action.payload.id
      },
      prepare(input: { name: string; path: string }) {
        const path = input.path.endsWith('/') ? input.path : `${input.path}/`
        const workspace: Workspace = {
          id: toWorkspaceId(input.name),
          name: input.name.trim(),
          path,
          kbPath: `${path}.note/`,
        }
        return { payload: workspace }
      },
    },
  },
})

export const { workspaceSelected, workspaceAdded } = workspacesSlice.actions
export const workspacesReducer = workspacesSlice.reducer

type StateWithWorkspaces = { workspaces: WorkspacesState }

export const selectWorkspaces = (state: StateWithWorkspaces) => state.workspaces.items
export const selectSelectedWorkspaceId = (state: StateWithWorkspaces) =>
  state.workspaces.selectedWorkspaceId
export const selectSelectedWorkspace = createSelector(
  [selectWorkspaces, selectSelectedWorkspaceId],
  (items, selectedId) => items.find((workspace) => workspace.id === selectedId),
)
export const selectWorkspaceById = (state: StateWithWorkspaces, workspaceId: string) =>
  state.workspaces.items.find((workspace) => workspace.id === workspaceId)
