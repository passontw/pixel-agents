import { all, fork } from 'redux-saga/effects'

import { agentsSaga } from '../features/agents/agentsSaga'
import { serverSaga } from '../features/server/serverSaga'

export function* rootSaga() {
  yield all([fork(serverSaga), fork(agentsSaga)])
}
