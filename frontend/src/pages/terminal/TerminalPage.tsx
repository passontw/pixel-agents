import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { useAppSelector } from '../../app/hooks'
import { AgentContextBar } from '../../components/AgentContextBar'
import { AgentStatusBar } from '../../components/AgentStatusBar'
import { selectAgentsOfWorkspace } from '../../features/agents/selectors'
import { useRouteAgent } from '../../hooks/useRouteAgent'
import { MOCK_HOOKS_STATUS } from '../../mocks/agents'
import { EMPTY_TERMINAL_OUTPUT, mockTerminalOutputs } from '../../mocks/terminal'
import { currentAutoRole } from '../../utils/agentText'
import { AgentNotFound } from '../agent/AgentNotFound'
import { TerminalOutput } from './TerminalOutput'

/** Terminal 頁：先以 mock 輸出靜態呈現，尚未接 /terminal WebSocket 與真實 PTY。 */
export function TerminalPage() {
  const agent = useRouteAgent()
  const workspaceAgents = useAppSelector((state) =>
    selectAgentsOfWorkspace(state, agent?.workspaceId ?? ''),
  )
  if (!agent) return <AgentNotFound />

  const lines = mockTerminalOutputs[agent.id] ?? EMPTY_TERMINAL_OUTPUT

  return (
    <>
      <AgentContextBar
        agent={agent}
        variant="terminal"
        autoRole={currentAutoRole(agent)}
        extra={
          <Typography variant="code11" color="text.subtle">
            {agent.branch}
          </Typography>
        }
      />
      <Box
        sx={(theme) => ({
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: `${theme.layout.contentPadding.compact}px ${theme.layout.contentPadding.regular}px`,
          backgroundColor: theme.vars.palette.background.deepest,
        })}
      >
        <Alert severity="info" sx={{ mb: 4 }}>
          尚未連接 /terminal WebSocket，以下為靜態的 mock 輸出，不是真實的終端機。
        </Alert>
        <TerminalOutput lines={lines} />
      </Box>
      <AgentStatusBar
        items={['auto mode on (shift+tab to cycle)', `← ${workspaceAgents.length} agents`]}
        autoRole={currentAutoRole(agent)}
        endItems={[`hooks: ${MOCK_HOOKS_STATUS}`, agent.branch]}
      />
    </>
  )
}
