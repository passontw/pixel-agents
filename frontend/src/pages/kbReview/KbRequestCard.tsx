import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

import { DiffBlock } from '../../components/DiffBlock'
import { RoleBadge } from '../../components/RoleBadge'
import { StatusDot } from '../../components/StatusDot'
import { ROLE_INFO } from '../../domain/roles'
import type { Agent, KbRequest } from '../../domain/types'
import { formatRelative } from '../../utils/time'

interface KbRequestCardProps {
  request: KbRequest
  agent?: Agent
  now: number
  canReview: boolean
  onApprove: () => void
  onReject: () => void
}

const STATUS_CHIP = {
  approved: { label: '已核准', color: 'success' },
  rejected: { label: '已拒絕', color: 'error' },
} as const

// 後端尚未提供：KB 寫入請求的審核與寫入。核准與拒絕目前只改前端狀態。
export function KbRequestCard({
  request,
  agent,
  now,
  canReview,
  onApprove,
  onReject,
}: KbRequestCardProps) {
  const isUpdate = request.kind === 'update'
  const resolved = request.status === 'pending' ? undefined : STATUS_CHIP[request.status]

  return (
    <Card component="article" data-testid={`kb-request-${request.id}`}>
      <Box
        sx={(theme) => ({
          padding: theme.spacing(3, 4),
          display: 'flex',
          alignItems: 'center',
          gap: 2.5,
          borderBottom: `1px solid ${theme.vars.palette.border.subtle}`,
        })}
      >
        <StatusDot status={agent?.status ?? 'idle'} />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {request.agentId}
        </Typography>
        {agent?.permissionRoles.map((role) => (
          <RoleBadge key={role} role={role} label={ROLE_INFO[role].englishLabel} />
        ))}
        <Typography variant="caption" color="text.subtle">
          →
        </Typography>
        <Typography variant="code11" color="text.secondary" noWrap>
          {request.path}
        </Typography>
        {isUpdate && <Chip label="更新" />}
        <Typography variant="caption" color="text.subtle" sx={{ ml: 'auto', flexShrink: 0 }}>
          {formatRelative(now - request.createdAt)}
        </Typography>
      </Box>
      <Box
        sx={{
          padding: (theme) => theme.spacing(3, 4),
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <Typography variant="overline" color="text.ghost">
          {isUpdate ? '更新差異（現有文件）' : '提案內容（新增區段）'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {request.title}
        </Typography>
        <DiffBlock lines={request.content} />
        <Typography variant="overline" color="text.ghost">
          來源上下文
        </Typography>
        <Typography variant="caption" color="text.muted">
          {request.sourceContext}
        </Typography>
      </Box>
      <Box
        sx={(theme) => ({
          padding: theme.spacing(2.5, 4),
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          borderTop: `1px solid ${theme.vars.palette.border.subtle}`,
        })}
      >
        {!resolved ? (
          <>
            <Button variant="outlined" color="error" disabled={!canReview} onClick={onReject}>
              拒絕
            </Button>
            <Button variant="contained" color="success" disabled={!canReview} onClick={onApprove}>
              核准寫入
            </Button>
          </>
        ) : (
          <Chip color={resolved.color} label={resolved.label} />
        )}
      </Box>
    </Card>
  )
}
