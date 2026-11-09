import { styled } from '@mui/material/styles'

import { ROLE_INFO } from '../domain/roles'
import type { RoleCode } from '../domain/types'
import type { RoleName } from '../theme'

const Badge = styled('span', { shouldForwardProp: (prop) => prop !== 'roleName' })<{
  roleName: RoleName
}>(({ theme, roleName }) => {
  const color = theme.vars.palette.role[roleName]
  return {
    ...theme.typography.badge,
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    padding: theme.spacing(0.25, 1.5),
    borderRadius: theme.layout.radius.badge,
    color: color.text,
    backgroundColor: color.bg,
    border: `1px solid ${color.border}`,
  }
})

interface RoleBadgeProps {
  role: RoleCode
  /** compact 只顯示代碼（側欄）；full 顯示「R 讀取」 */
  variant?: 'compact' | 'full'
  /** 覆寫顯示文字，例如卡片上的「Edit」 */
  label?: string
}

export function RoleBadge({ role, variant = 'compact', label }: RoleBadgeProps) {
  const info = ROLE_INFO[role]
  const text = label ?? (variant === 'full' ? `${info.code} ${info.label}` : info.code)
  return (
    <Badge roleName={info.themeName} data-role={role}>
      {text}
    </Badge>
  )
}
