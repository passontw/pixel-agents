import AddIcon from '@mui/icons-material/Add'
import SettingsIcon from '@mui/icons-material/Settings'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { NavLink } from 'react-router'

import { paths } from '../app/paths'
import { AgentListItem } from './AgentListItem'
import { RoleLegend, SidebarHeader, SidebarLabel } from './SidebarParts'

// 階段 2 的暫時靜態資料；階段 3 改接 Redux state。
const PLACEHOLDER_AGENTS = [
  { agentId: 'passontw-backend', name: 'passontw-backend', detail: 'running · 3m 12s' },
]

export function Sidebar() {
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
      <Box sx={{ padding: (theme) => theme.spacing(3, 3, 2) }}>
        <SidebarLabel>Agents</SidebarLabel>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', padding: (theme) => theme.spacing(0, 2) }}>
        {PLACEHOLDER_AGENTS.map((agent) => (
          <AgentListItem key={agent.agentId} {...agent} status="running" roles={['E']} />
        ))}
      </Box>
      <RoleLegend />
      <Box
        sx={(theme) => ({
          padding: theme.spacing(2.5, 3),
          borderTop: `1px solid ${theme.vars.palette.divider}`,
        })}
      >
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
      </Box>
    </Box>
  )
}
