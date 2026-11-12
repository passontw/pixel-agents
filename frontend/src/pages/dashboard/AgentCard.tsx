import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { Link, useNavigate } from 'react-router'

import { paths } from '../../app/paths'
import { useAppSelector } from '../../app/hooks'
import { selectAgentDetails } from '../../features/agents/selectors'
import {
  selectPendingKbRequests,
  selectPendingKbRequestsOfAgent,
} from '../../features/kb/selectors'
import { RoleBadge } from '../../components/RoleBadge'
import { StatusChip } from '../../components/StatusChip'
import { StatusDot } from '../../components/StatusDot'
import { ROLE_INFO } from '../../domain/roles'
import type { Agent } from '../../domain/types'
import { formatElapsed } from '../../utils/time'
import { AgentCardMenu } from './AgentCardMenu'
import { IdleSummary, KbRequestNotice, ToolRow } from './AgentCardParts'

const RECENT_TOOL_COUNT = 2

export function AgentCard({ agent, now }: { agent: Agent; now: number }) {
  const navigate = useNavigate()
  const log = useAppSelector((state) => selectAgentDetails(state, agent.id)).sessionLog
  const ownPending = useAppSelector((state) => selectPendingKbRequestsOfAgent(state, agent.id))
  const workspacePending = useAppSelector((state) =>
    selectPendingKbRequests(state, agent.workspaceId),
  )
  const recent = log.slice(-RECENT_TOOL_COUNT)
  const isIdle = agent.status === 'idle'

  return (
    <Card data-testid={`agent-card-${agent.id}`}>
      <Box
        sx={(theme) => ({
          padding: theme.spacing(3.5, 4, 3),
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2.5,
          borderBottom: `1px solid ${theme.vars.palette.border.subtle}`,
        })}
      >
        <Box sx={{ mt: 1 }}>
          <StatusDot status={agent.status} size="card" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
            <Typography
              variant="h2"
              component="h2"
              sx={{ cursor: 'pointer', color: isIdle ? 'text.secondary' : 'text.primary' }}
              onClick={() => navigate(paths.agent(agent.id))}
            >
              {agent.name}
            </Typography>
            {agent.permissionRoles.map((role) => (
              <RoleBadge key={role} role={role} label={ROLE_INFO[role].englishLabel} />
            ))}
            {agent.isKbWriter && <RoleBadge role="W" label="W · KB Writer" />}
          </Box>
          <Typography variant="code10" color="text.subtle" component="div" noWrap sx={{ mt: 0.5 }}>
            {agent.cwd}
          </Typography>
        </Box>
        <StatusChip status={agent.status} />
      </Box>
      <Box
        sx={(theme) => ({
          padding: theme.spacing(3, 4),
          minHeight: theme.spacing(16),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 1,
          backgroundColor: theme.vars.palette.background.inset,
        })}
      >
        {isIdle ? (
          <IdleSummary
            lastActiveAgo={now - agent.lastActiveAt}
            pendingCount={agent.isKbWriter ? workspacePending.length : 0}
          />
        ) : (
          recent.map((entry) => <ToolRow key={entry.id} entry={entry} />)
        )}
        {agent.status === 'waiting' && ownPending.length > 0 && <KbRequestNotice />}
      </Box>
      <Box
        sx={(theme) => ({
          padding: theme.spacing(2.5, 4),
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderTop: `1px solid ${theme.vars.palette.border.subtle}`,
        })}
      >
        <Typography variant="caption" color="text.subtle">
          {isIdle ? '—' : formatElapsed(now - agent.startedAt)}
        </Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1.5 }}>
          <Button component={Link} to={paths.terminal(agent.id)} variant="outlined" color="inherit">
            Terminal
          </Button>
          <AgentCardMenu agent={agent} />
        </Box>
      </Box>
    </Card>
  )
}
