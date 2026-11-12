import AddIcon from '@mui/icons-material/Add'
import SettingsIcon from '@mui/icons-material/Settings'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import { NavLink } from 'react-router'

import { paths } from '../app/paths'
import { useAppSelector } from '../app/hooks'
import { selectAgentsOfWorkspace, selectKbWriterOfWorkspace } from '../features/agents/selectors'
import { selectPendingKbRequests } from '../features/kb/selectors'
import { selectSelectedWorkspaceId } from '../features/workspaces/workspacesSlice'
import { useNow } from '../hooks/useNow'
import { agentDetailText, agentRoleCodes } from '../utils/agentText'
import { AgentListItem } from './AgentListItem'
import { ServerIndicator } from './ServerIndicator'
import { RoleLegend, SidebarHeader, SidebarLabel } from './SidebarParts'
import { WorkspaceSelect } from './WorkspaceSelect'

export function Sidebar() {
  const now = useNow()
  const workspaceId = useAppSelector(selectSelectedWorkspaceId)
  const agents = useAppSelector((state) => selectAgentsOfWorkspace(state, workspaceId))
  const kbWriter = useAppSelector((state) => selectKbWriterOfWorkspace(state, workspaceId))
  const pending = useAppSelector((state) => selectPendingKbRequests(state, workspaceId))

  return (
    <Box
      component="nav"
      aria-label="側欄"
      sx={(theme) => ({
        width: theme.layout.sidebarWidth,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.vars.palette.background.paper,
        borderRight: `1px solid ${theme.vars.palette.divider}`,
      })}
    >
      <SidebarHeader />
      <WorkspaceSelect />
      <Box sx={{ padding: (theme) => theme.spacing(1, 3, 1.5) }}>
        <SidebarLabel>{`Agents · ${agents.length}`}</SidebarLabel>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', padding: (theme) => theme.spacing(0, 2) }}>
        {agents.map((agent) => (
          <AgentListItem
            key={agent.id}
            agentId={agent.id}
            name={agent.name}
            status={agent.status}
            roles={agentRoleCodes(agent)}
            isKbWriter={agent.isKbWriter}
            detail={agentDetailText(agent, now, agent.isKbWriter ? pending.length : 0)}
          />
        ))}
      </Box>
      <RoleLegend />
      <Box
        sx={(theme) => ({
          padding: theme.spacing(2.5, 3),
          borderTop: `1px solid ${theme.vars.palette.divider}`,
        })}
      >
        {kbWriter && (
          <Button
            variant="outlined"
            color="inherit"
            fullWidth
            component={NavLink}
            to={paths.kbReview}
            sx={{ mb: 1.5, justifyContent: 'space-between' }}
          >
            KB Review
            <Chip color="error" label={pending.length} />
          </Button>
        )}
        <Button
          variant="dashed"
          fullWidth
          component={NavLink}
          to={paths.newAgent}
          startIcon={<AddIcon />}
          sx={{ mb: 1.5 }}
        >
          New Agent
        </Button>
        <Button color="inherit" startIcon={<SettingsIcon />} sx={{ color: 'text.ghost' }}>
          Settings
        </Button>
        <ServerIndicator />
      </Box>
    </Box>
  )
}
