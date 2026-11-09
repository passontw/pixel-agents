import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useParams } from 'react-router'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { RoleBadge } from '../../components/RoleBadge'
import { PERMISSION_ROLES } from '../../domain/roles'
import type { PermissionRole } from '../../domain/types'
import { agentPermissionRolesChanged } from '../../features/agents/agentsSlice'
import { selectAgentById, selectRoleActivity } from '../../features/agents/selectors'
import { RolesStep } from '../addAgent/RolesStep'

export function RoleActivityPage() {
  const { agentId = '' } = useParams()
  const dispatch = useAppDispatch()
  const agent = useAppSelector((state) => selectAgentById(state, agentId))
  const groups = useAppSelector((state) => selectRoleActivity(state, agentId))
  if (!agent) return null

  const roles = Object.fromEntries(
    PERMISSION_ROLES.map((role) => [role, agent.permissionRoles.includes(role)]),
  ) as Record<PermissionRole, boolean>

  const toggle = (role: PermissionRole, enabled: boolean) => {
    const next = enabled
      ? [...agent.permissionRoles, role]
      : agent.permissionRoles.filter((item) => item !== role)
    dispatch(agentPermissionRolesChanged({ agentId, roles: next }))
  }

  return (
    <Box
      sx={(theme) => ({
        padding: `${theme.layout.contentPadding.compact}px ${theme.layout.contentPadding.regular}px`,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        gap: 8,
        alignContent: 'start',
      })}
    >
      <Box>
        <Typography variant="h2" component="h2" sx={{ mb: 3 }}>
          已指派的 Roles
        </Typography>
        <RolesStep roles={roles} onToggle={toggle} />
      </Box>
      <Box>
        <Typography variant="h2" component="h2" sx={{ mb: 3 }}>
          依 Auto Role 的工具呼叫
        </Typography>
        {groups.length === 0 && (
          <Typography variant="body2" color="text.subtle">
            尚無角色活動
          </Typography>
        )}
        {groups.map((group) => (
          <Box key={group.role} sx={{ mb: 4 }} data-testid={`role-group-${group.role}`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <RoleBadge role={group.role} variant="full" />
              <Typography
                variant="caption"
                color="text.subtle"
              >{`${group.entries.length} 次`}</Typography>
            </Box>
            {group.entries.map((entry) => (
              <Box key={entry.id} sx={{ display: 'flex', gap: 3, py: 0.75 }}>
                <Typography
                  variant="code11"
                  color="text.muted"
                  sx={{ width: (theme) => theme.spacing(14) }}
                >
                  {entry.tool}
                </Typography>
                <Typography variant="code11" color="text.secondary" noWrap>
                  {entry.argument}
                </Typography>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
