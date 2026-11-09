import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router'

import { paths } from '../../app/paths'
import { DiffBlock } from '../../components/DiffBlock'
import { ROLE_INFO } from '../../domain/roles'
import type { Agent, KbRequest } from '../../domain/types'

interface KbRequestBannerProps {
  agent: Agent
  request: KbRequest
  writerName?: string
}

// 後端尚未提供 KB 寫入請求：橫幅內容來自 mock。
export function KbRequestBanner({ agent, request, writerName }: KbRequestBannerProps) {
  const roleText = agent.permissionRoles.map((role) => ROLE_INFO[role].englishLabel).join('/')
  return (
    <Box
      sx={(theme) => ({
        padding: theme.spacing(3.5, 4),
        display: 'flex',
        gap: 3,
        borderRadius: theme.layout.radius.card,
        backgroundColor: theme.vars.palette.status.waiting.bg,
        border: `1px solid ${theme.vars.palette.status.waiting.border}`,
      })}
    >
      <ArticleOutlinedIcon color="warning" fontSize="small" />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
          KB 寫入請求已提交
        </Typography>
        <Typography variant="caption" color="text.muted">
          {`此 Agent (${roleText} role) 嘗試寫入工作空間知識庫，請求已轉交 KB Writer 審核。`}
        </Typography>
        <Typography variant="code11" color="text.secondary">
          {request.path}
        </Typography>
        <DiffBlock lines={request.content} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {writerName && (
            <Typography
              variant="caption"
              color="text.subtle"
            >{`待 ${writerName} (W) 審核`}</Typography>
          )}
          <Button component={Link} to={paths.kbReview} variant="outlined" color="warning">
            查看請求
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
