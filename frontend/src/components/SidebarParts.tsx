import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

import { ROLE_CODES } from '../domain/roles'
import { Logo } from './Logo'
import { RoleBadge } from './RoleBadge'

/** 側欄標題列：logo 與 passon agents。 */
export function SidebarHeader() {
  return (
    <Box
      sx={(theme) => ({
        height: theme.layout.headerHeight,
        padding: theme.spacing(0, 4),
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexShrink: 0,
        borderBottom: `1px solid ${theme.vars.palette.divider}`,
      })}
    >
      <Logo />
      <Typography
        variant="body1"
        component="span"
        sx={{ fontWeight: 600, letterSpacing: '0.02em' }}
      >
        passon agents
      </Typography>
    </Box>
  )
}

export function SidebarLabel({ children }: { children: ReactNode }) {
  return (
    <Typography variant="overline" component="div" color="text.ghost">
      {children}
    </Typography>
  )
}

/** Roles 圖例：R 讀取、E 編輯、D 刪除、W KB寫入。 */
export function RoleLegend() {
  return (
    <Box
      sx={(theme) => ({
        padding: theme.spacing(2, 3),
        borderTop: `1px solid ${theme.vars.palette.border.subtle}`,
        flexShrink: 0,
      })}
    >
      <SidebarLabel>Roles</SidebarLabel>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mt: 1.25 }}>
        {ROLE_CODES.map((role) => (
          <RoleBadge key={role} role={role} variant="full" />
        ))}
      </Box>
    </Box>
  )
}
