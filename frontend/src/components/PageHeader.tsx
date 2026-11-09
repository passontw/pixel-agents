import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Box
      component="header"
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        gap: 3,
        padding: theme.spacing(5, 6, 4),
        borderBottom: `1px solid ${theme.vars.palette.divider}`,
      })}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h1" component="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.subtle" component="div" sx={{ mt: 0.25 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>{actions}</Box>
      )}
    </Box>
  )
}
