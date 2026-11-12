import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { matchPath, NavLink, Outlet, useLocation } from 'react-router'

import { AGENT_TABS } from '../app/paths'
import { useAppSelector } from '../app/hooks'
import { AgentContextBar } from '../components/AgentContextBar'
import { AgentStatusBar } from '../components/AgentStatusBar'
import { selectAgentDetails } from '../features/agents/selectors'
import { selectPendingKbRequestsOfAgent } from '../features/kb/selectors'
import { useNow } from '../hooks/useNow'
import { useRouteAgent } from '../hooks/useRouteAgent'
import { MOCK_HOOKS_STATUS } from '../mocks/agents'
import { AgentNotFound } from '../pages/agent/AgentNotFound'
import { currentAutoRole } from '../utils/agentText'
import { formatElapsed } from '../utils/time'

/** Agent 詳細頁：脈絡列、用路由切換的分頁、子路由內容、底部狀態列。 */
export function AgentDetailLayout() {
  const agent = useRouteAgent()
  const now = useNow()
  const { pathname } = useLocation()
  const details = useAppSelector((state) => selectAgentDetails(state, agent?.id))
  const pending = useAppSelector((state) => selectPendingKbRequestsOfAgent(state, agent?.id))

  if (!agent) return <AgentNotFound />

  const activeTab =
    AGENT_TABS.find((tab) => matchPath(`/agents/:agentId/${tab.value}`, pathname))?.value ?? false
  const autoRole = currentAutoRole(agent)

  return (
    <>
      <AgentContextBar agent={agent} autoRole={autoRole} />
      <Tabs value={activeTab} aria-label="Agent 分頁">
        {AGENT_TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            component={NavLink}
            to={tab.value}
            label={
              tab.value === 'files' ? (
                <Box
                  component="span"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}
                >
                  {tab.label}
                  <Chip label={details.filesChanged.length} />
                </Box>
              ) : (
                tab.label
              )
            }
          />
        ))}
      </Tabs>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <Outlet />
      </Box>
      <AgentStatusBar
        autoRole={autoRole}
        items={[
          agent.status === 'idle' ? '—' : formatElapsed(now - agent.startedAt),
          `${details.sessionLog.length} tool calls`,
          agent.branch,
          `hooks: ${MOCK_HOOKS_STATUS}`,
        ]}
        trailing={pending.length > 0 ? `${pending.length} KB request pending` : undefined}
      />
    </>
  )
}
