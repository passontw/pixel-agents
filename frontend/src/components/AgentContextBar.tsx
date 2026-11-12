import BoltIcon from '@mui/icons-material/Bolt'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'

import { paths } from '../app/paths'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { ROLE_INFO } from '../domain/roles'
import type { Agent, PermissionRole } from '../domain/types'
import { agentStopRequested } from '../features/agents/agentsSlice'
import { selectStoppingIds } from '../features/agents/selectors'
import { StatusDot } from './StatusDot'

interface AgentContextBarProps {
  agent: Agent
  autoRole?: PermissionRole
  /** 在 Terminal 頁，Terminal 按鈕換成 Session Log */
  variant?: 'detail' | 'terminal'
  extra?: ReactNode
}

/** Agent 脈絡列（高 40）：名稱、路徑、Auto Role 指示、Terminal/Stop/更多。 */
export function AgentContextBar({
  agent,
  autoRole,
  variant = 'detail',
  extra,
}: AgentContextBarProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const stopping = useAppSelector(selectStoppingIds).includes(agent.id)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const roleName = autoRole ? ROLE_INFO[autoRole].themeName : undefined

  return (
    <Box
      sx={(theme) => ({
        height: theme.layout.contextBarHeight,
        flexShrink: 0,
        padding: theme.spacing(0, 4),
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        backgroundColor: theme.vars.palette.background.paper,
        borderBottom: `1px solid ${theme.vars.palette.divider}`,
      })}
    >
      <StatusDot status={agent.status} size="card" />
      <Typography variant="h2" component="h1">
        {agent.name}
      </Typography>
      <Typography variant="code11" color="text.subtle" noWrap>
        {agent.cwd}
      </Typography>
      {extra}
      {autoRole && roleName && (
        <Box
          sx={(theme) => ({
            ml: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: theme.vars.palette.role[roleName].text,
          })}
        >
          <BoltIcon fontSize="inherit" />
          <Typography variant="caption" sx={{ fontWeight: 500, color: 'inherit' }}>
            {`Auto: ${ROLE_INFO[autoRole].englishLabel} role`}
          </Typography>
        </Box>
      )}
      <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
        <Button
          component={Link}
          to={variant === 'terminal' ? paths.agentLog(agent.id) : paths.terminal(agent.id)}
          variant="outlined"
          color="inherit"
        >
          {variant === 'terminal' ? 'Session Log' : 'Terminal'}
        </Button>
        <Button
          variant="outlined"
          color="error"
          disabled={agent.status === 'idle' || stopping}
          onClick={() => dispatch(agentStopRequested({ agentId: agent.id }))}
        >
          {stopping ? 'Stopping…' : 'Stop'}
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          aria-label="更多操作"
          onClick={(e) => setAnchor(e.currentTarget)}
        >
          <MoreHorizIcon fontSize="inherit" />
        </Button>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          <MenuItem onClick={() => navigate(paths.dashboard)}>回到 Dashboard</MenuItem>
        </Menu>
      </Box>
    </Box>
  )
}
