import { styled } from '@mui/material/styles'

import type { AgentStatus } from '../domain/types'

const Pill = styled('span', { shouldForwardProp: (prop) => prop !== 'status' })<{
  status: AgentStatus
}>(({ theme, status }) => {
  const color = theme.vars.palette.status[status]
  return {
    ...theme.typography.caption,
    flexShrink: 0,
    padding: theme.spacing(0.5, 2),
    borderRadius: theme.layout.radius.button,
    color: color.text,
    backgroundColor: color.bg,
    border: `1px solid ${color.border}`,
  }
})

/** Agent 狀態標籤：running、waiting、idle。 */
export function StatusChip({ status }: { status: AgentStatus }) {
  return <Pill status={status}>{status}</Pill>
}
