import Box from '@mui/material/Box'
import FormHelperText from '@mui/material/FormHelperText'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

import { RoleBadge } from '../../components/RoleBadge'
import { PERMISSION_ROLE_DETAILS, PERMISSION_ROLES } from '../../domain/roles'
import type { PermissionRole } from '../../domain/types'

interface RolesStepProps {
  roles: Record<PermissionRole, boolean>
  error?: string
  onToggle: (role: PermissionRole, enabled: boolean) => void
}

/** 步驟 2：指派 Roles（R/E/D 三個 Switch，附說明與涵蓋工具）。 */
export function RolesStep({ roles, error, onToggle }: RolesStepProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {PERMISSION_ROLES.map((role) => {
        const detail = PERMISSION_ROLE_DETAILS[role]
        return (
          <Box
            key={role}
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 3.5,
              padding: theme.spacing(3, 4),
              borderRadius: theme.layout.radius.workspace,
              border: `1px solid ${theme.vars.palette.divider}`,
              backgroundColor: theme.vars.palette.background.paper,
            })}
          >
            <RoleBadge role={role} variant="full" />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2">{detail.description}</Typography>
              <Typography variant="code10" color="text.subtle">
                {detail.tools}
              </Typography>
            </Box>
            <Switch
              checked={roles[role]}
              onChange={(event) => onToggle(role, event.target.checked)}
              slotProps={{ input: { 'aria-label': `${role} ${detail.description}` } }}
            />
          </Box>
        )
      })}
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  )
}
