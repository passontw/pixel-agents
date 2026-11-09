import BoltIcon from '@mui/icons-material/Bolt'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

import { ROLE_INFO } from '../domain/roles'
import type { PermissionRole } from '../domain/types'

export interface AgentStatusBarProps {
  items: ReactNode[]
  autoRole?: PermissionRole
  /** 右側的一般項目，位於 Auto Role 之前 */
  endItems?: ReactNode[]
  /** 右側強調提示，例如「1 KB request pending」 */
  trailing?: ReactNode
}

/** 底部狀態列（高 28）：左側為項目清單，右側為 Auto Role 與其他提示。 */
export function AgentStatusBar({ items, autoRole, endItems = [], trailing }: AgentStatusBarProps) {
  return (
    <Box
      component="footer"
      sx={(theme) => ({
        height: theme.layout.statusBarHeight,
        flexShrink: 0,
        padding: theme.spacing(0, 4),
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.vars.palette.background.deepest,
        borderTop: `1px solid ${theme.vars.palette.divider}`,
      })}
    >
      {items.map((item, index) => (
        <Typography key={index} variant="code10" color="text.subtle" component="span">
          {item}
        </Typography>
      ))}
      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
        {endItems.map((item, index) => (
          <Typography key={index} variant="code10" color="text.subtle" component="span">
            {item}
          </Typography>
        ))}
        {autoRole && (
          <Typography
            variant="code10"
            component="span"
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: theme.vars.palette.role[ROLE_INFO[autoRole].themeName].text,
            })}
          >
            <BoltIcon fontSize="inherit" />
            {`Auto Role: ${ROLE_INFO[autoRole].englishLabel}`}
          </Typography>
        )}
        {trailing && (
          <Typography variant="code10" color="warning.main" component="span">
            {trailing}
          </Typography>
        )}
      </Box>
    </Box>
  )
}
