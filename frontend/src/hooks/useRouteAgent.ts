import { useEffect } from 'react'
import { useParams } from 'react-router'

import { useAppDispatch, useAppSelector } from '../app/hooks'
import { agentSelected } from '../features/agents/agentsSlice'
import { selectAgentById } from '../features/agents/selectors'

/** 取得路由 :agentId 對應的 Agent，並同步 selectedAgentId。 */
export function useRouteAgent() {
  const { agentId } = useParams()
  const dispatch = useAppDispatch()
  const agent = useAppSelector((state) => selectAgentById(state, agentId))

  useEffect(() => {
    dispatch(agentSelected(agent ? agent.id : null))
  }, [dispatch, agent])

  return agent
}
