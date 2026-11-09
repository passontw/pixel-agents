import ButtonBase from '@mui/material/ButtonBase'
import Typography from '@mui/material/Typography'

import { useAppDispatch, useAppSelector } from '../app/hooks'
import { healthRequested } from '../features/server/serverSlice'
import type { ServerRequestState } from '../features/server/serverSlice'
import type { AgentStatus } from '../domain/types'
import { StatusDot } from './StatusDot'

const SERVER_LABELS: Record<ServerRequestState, { text: string; status: AgentStatus }> = {
  idle: { text: '後端：未檢查', status: 'idle' },
  loading: { text: '後端：檢查中…', status: 'waiting' },
  ok: { text: '後端：已連線', status: 'running' },
  error: { text: '後端：無法連線', status: 'idle' },
}

/** 側欄底部的小型後端連線指示；點擊重新檢查。 */
export function ServerIndicator() {
  const dispatch = useAppDispatch()
  const request = useAppSelector((state) => state.server.request)
  const { text, status } = SERVER_LABELS[request]

  return (
    <ButtonBase
      onClick={() => dispatch(healthRequested())}
      aria-label={`${text}，點擊重新檢查`}
      sx={(theme) => ({
        gap: 2,
        padding: theme.spacing(1, 1.5),
        borderRadius: theme.layout.radius.badge,
      })}
    >
      <StatusDot status={status} />
      <Typography variant="caption" color="text.ghost">
        {text}
      </Typography>
    </ButtonBase>
  )
}
