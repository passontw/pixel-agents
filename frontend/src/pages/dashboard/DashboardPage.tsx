import AddIcon from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router'

import { paths } from '../../app/paths'
import { useAppSelector } from '../../app/hooks'
import {
  selectAgentsOfWorkspace,
  selectKbWriterOfWorkspace,
  selectWorkspaceSummary,
} from '../../features/agents/selectors'
import { selectPendingKbRequests } from '../../features/kb/selectors'
import { selectSelectedWorkspace } from '../../features/workspaces/workspacesSlice'
import { useNow } from '../../hooks/useNow'
import { AgentCard } from './AgentCard'
import { DashboardSummary } from './DashboardSummary'

export function DashboardPage() {
  const now = useNow()
  const workspace = useAppSelector(selectSelectedWorkspace)
  const workspaceId = workspace?.id ?? ''
  const agents = useAppSelector((state) => selectAgentsOfWorkspace(state, workspaceId))
  const summary = useAppSelector((state) => selectWorkspaceSummary(state, workspaceId))
  const kbWriter = useAppSelector((state) => selectKbWriterOfWorkspace(state, workspaceId))
  const pending = useAppSelector((state) => selectPendingKbRequests(state, workspaceId))

  if (!workspace) return null

  return (
    <>
      <DashboardSummary
        workspace={workspace}
        summary={summary}
        kbWriter={kbWriter}
        pendingCount={pending.length}
      />
      <Box
        sx={(theme) => ({
          flex: 1,
          overflowY: 'auto',
          padding: `${theme.layout.contentPadding.compact}px ${theme.layout.contentPadding.regular}px`,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
          gap: 3,
          alignContent: 'start',
        })}
      >
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} now={now} />
        ))}
        <ButtonBase
          component={Link}
          to={paths.newAgent}
          sx={(theme) => ({
            minHeight: theme.spacing(40),
            flexDirection: 'column',
            gap: 2,
            borderRadius: theme.layout.radius.card,
            border: `1px dashed ${theme.vars.palette.divider}`,
            backgroundColor: theme.vars.palette.background.inset,
            color: theme.vars.palette.text.ghost,
          })}
        >
          <AddIcon />
          <Typography variant="body2">{`新增 Agent 到 ${workspace.name}`}</Typography>
        </ButtonBase>
      </Box>
    </>
  )
}
