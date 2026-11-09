import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'

import { agentsReducer } from '../features/agents/agentsSlice'
import { kbReducer } from '../features/kb/kbSlice'
import { serverReducer } from '../features/server/serverSlice'
import { workspacesReducer } from '../features/workspaces/workspacesSlice'
import { rootSaga } from './rootSaga'

export function createAppStore() {
  const sagaMiddleware = createSagaMiddleware()
  const store = configureStore({
    reducer: {
      server: serverReducer,
      workspaces: workspacesReducer,
      agents: agentsReducer,
      kb: kbReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware),
  })
  sagaMiddleware.run(rootSaga)
  return store
}

export const store = createAppStore()

export type AppStore = ReturnType<typeof createAppStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
