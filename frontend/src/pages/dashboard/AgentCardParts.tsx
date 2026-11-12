import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Link } from 'react-router'

import { paths } from '../../app/paths'
import { ROLE_INFO } from '../../domain/roles'
import type { SessionEntry } from '../../domain/types'
import { formatRelative } from '../../utils/time'

const TOOL_LABEL_WIDTH = 52

/** 卡片內文的一列工具呼叫：工具標籤（依 Auto Role 上色）、參數、統計或執行中指示。 */
export function ToolRow({ entry }: { entry: SessionEntry }) {
  const role = ROLE_INFO[entry.autoRole].themeName
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography
        variant="code10"
        sx={(theme) => ({
          width: TOOL_LABEL_WIDTH,
          flexShrink: 0,
          color: theme.vars.palette.role[role].text,
        })}
      >
        {entry.tool}
      </Typography>
      <Typography variant="code10" color="text.muted" noWrap>
        {entry.argument}
      </Typography>
      {entry.meta && (
        <Typography variant="code10" color="success.main" sx={{ ml: 'auto', flexShrink: 0 }}>
          {entry.meta}
        </Typography>
      )}
      {entry.status === 'running' && (
        <Box
          component="span"
          aria-label="執行中"
          sx={(theme) => ({
            ml: 'auto',
            flexShrink: 0,
            width: theme.layout.dotSize.card - 3,
            height: theme.layout.dotSize.card - 3,
            borderRadius: '50%',
            backgroundColor: theme.vars.palette.primary.main,
          })}
        />
      )}
    </Box>
  )
}

/** waiting 卡片上的 KB 寫入請求提示（後端尚未提供，資料為 mock）。 */
export function KbRequestNotice() {
  return (
    <Box
      sx={(theme) => ({
        mt: 1.5,
        padding: theme.spacing(1.75, 2.5),
        display: 'flex',
        alignItems: 'center',
        gap: 1.75,
        borderRadius: theme.layout.radius.button,
        backgroundColor: theme.vars.palette.status.waiting.bg,
        border: `1px solid ${theme.vars.palette.status.waiting.border}`,
      })}
    >
      <WarningAmberIcon fontSize="inherit" color="warning" />
      <Typography variant="caption" component="span" sx={{ flex: 1 }} color="warning.main">
        KB 寫入請求待審核
      </Typography>
      <Button component={Link} to={paths.kbReview} variant="outlined" color="warning">
        Review
      </Button>
    </Box>
  )
}

/** idle 卡片內文：無近期活動、最後活動時間、待審 KB 數。 */
export function IdleSummary({
  lastActiveAgo,
  pendingCount,
}: {
  lastActiveAgo: number
  pendingCount: number
}) {
  return (
    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
      <Typography variant="caption" color="text.ghost">
        無近期活動
      </Typography>
      <Typography variant="caption" color="text.ghost">
        {`Last active ${formatRelative(lastActiveAgo).replace(' 前', ' ago')}`}
      </Typography>
      {pendingCount > 0 && (
        <Chip color="success" label={`${pendingCount} pending KB reviews`} sx={{ mt: 1.5 }} />
      )}
    </Box>
  )
}
