import ButtonBase from '@mui/material/ButtonBase'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { NavLink } from 'react-router'

import type { AgentStatus, RoleCode } from '../domain/types'
import { paths } from '../app/paths'
import { RoleBadge } from './RoleBadge'
import { StatusDot } from './StatusDot'

interface AgentListItemProps {
  agentId: string
  name: string
  status: AgentStatus
  /** 徽章：權限角色，KB Writer 另加 W */
  roles: RoleCode[]
  /** 第二行文字，例如「running · 3m 12s」 */
  detail: string
  isKbWriter?: boolean
}

// 目前頁面由 NavLink 設定的 aria-current="page" 決定是否反白。
export function AgentListItem({
  agentId,
  name,
  status,
  roles,
  detail,
  isKbWriter = false,
}: AgentListItemProps) {
  return (
    <ButtonBase
      component={NavLink}
      to={paths.agent(agentId)}
      sx={(theme) => {
        const selectedColor = isKbWriter ? theme.vars.palette.role.kbWrite : null
        return {
          display: 'block',
          width: '100%',
          textAlign: 'left',
          marginBottom: 0.75,
          padding: theme.spacing(2, 2),
          borderRadius: theme.layout.radius.input,
          border: '1px solid transparent',
          borderLeft: '3px solid transparent',
          '&[aria-current="page"]': {
            backgroundColor: selectedColor?.bg ?? theme.vars.palette.action.selected,
            borderColor: selectedColor?.border ?? theme.alpha(theme.vars.palette.primary.main, 0.2),
            borderLeftColor: selectedColor?.text ?? theme.vars.palette.primary.main,
          },
          '&:hover': { backgroundColor: theme.vars.palette.action.hover },
        }
      }}
    >
      <Stack direction="row" component="span" sx={{ alignItems: 'center', gap: 1.75 }}>
        <StatusDot status={status} />
        <Typography
          variant="body2"
          noWrap
          sx={(theme) => ({
            flex: 1,
            color:
              status === 'idle' ? theme.vars.palette.text.muted : theme.vars.palette.text.primary,
            fontWeight: status === 'running' ? 500 : 400,
          })}
        >
          {name}
        </Typography>
        {roles.map((role) => (
          <RoleBadge key={role} role={role} />
        ))}
      </Stack>
      <Typography
        variant="code10"
        component="span"
        sx={(theme) => ({
          display: 'block',
          marginTop: 0.75,
          paddingLeft: 3.5,
          color: theme.vars.palette.status[status].text,
        })}
      >
        {detail}
      </Typography>
    </ButtonBase>
  )
}
