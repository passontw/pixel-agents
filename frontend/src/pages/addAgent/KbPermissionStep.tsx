import Box from '@mui/material/Box'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'

import { RoleBadge } from '../../components/RoleBadge'

interface KbPermissionStepProps {
  isKbWriter: boolean
  currentWriterName?: string
  onChange: (enabled: boolean) => void
}

/** 步驟 3：知識庫權限（KB Writer 開關；每個工作空間只能一位）。 */
export function KbPermissionStep({
  isKbWriter,
  currentWriterName,
  onChange,
}: KbPermissionStepProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        sx={(theme) => ({
          padding: theme.spacing(3, 4),
          borderRadius: theme.layout.radius.workspace,
          border: `1px solid ${theme.vars.palette.divider}`,
          backgroundColor: theme.vars.palette.background.paper,
        })}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3.5 }}>
          <RoleBadge role="W" variant="full" label="W KB Writer" />
          <Typography variant="body2" sx={{ flex: 1 }}>
            指定為工作空間 KB Writer
          </Typography>
          <Switch
            checked={isKbWriter}
            onChange={(event) => onChange(event.target.checked)}
            slotProps={{ input: { 'aria-label': '指定為工作空間 KB Writer' } }}
          />
        </Box>
        <Typography variant="caption" color="text.subtle" component="div" sx={{ mt: 2 }}>
          每個工作空間只能有一個 KB Writer
        </Typography>
        {currentWriterName && (
          <Typography
            variant="caption"
            color={isKbWriter ? 'warning.main' : 'text.subtle'}
            component="div"
          >
            {isKbWriter
              ? `目前：${currentWriterName} 是 KB Writer，新增後將由此 Agent 取代`
              : `目前：${currentWriterName} 已是 KB Writer`}
          </Typography>
        )}
      </Box>
      <Box
        sx={(theme) => ({
          padding: theme.spacing(3, 4),
          borderRadius: theme.layout.radius.workspace,
          border: `1px solid ${theme.vars.palette.border.strong}`,
          backgroundColor: theme.vars.palette.background.inset,
        })}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ArticleOutlinedIcon fontSize="small" color="primary" />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            KB 寫入請求模式（已啟用）
          </Typography>
        </Box>
        <Typography variant="caption" color="text.subtle" component="div" sx={{ mt: 1 }}>
          此 Agent 可提交 KB 寫入請求，由 KB Writer 審核後執行
        </Typography>
      </Box>
    </Box>
  )
}
