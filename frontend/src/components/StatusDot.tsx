import { styled } from '@mui/material/styles'

import type { AgentStatus } from '../domain/types'

interface StatusDotProps {
  status: AgentStatus
  size?: 'sidebar' | 'card'
}

const Dot = styled('span', {
  shouldForwardProp: (prop) => prop !== 'status' && prop !== 'dotSize',
})<{ status: AgentStatus; dotSize: 'sidebar' | 'card' }>(({ theme, status, dotSize }) => {
  const color = theme.vars.palette.status[status]
  const diameter = theme.layout.dotSize[dotSize]
  return {
    display: 'inline-block',
    flexShrink: 0,
    width: diameter,
    height: diameter,
    borderRadius: '50%',
    backgroundColor: color.main,
    // running 與 waiting 有發光，idle 沒有
    boxShadow: status === 'idle' ? 'none' : `0 0 6px ${color.glow}`,
  }
})

export function StatusDot({ status, size = 'sidebar' }: StatusDotProps) {
  return <Dot status={status} dotSize={size} data-status={status} role="img" aria-label={status} />
}
