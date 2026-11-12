import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { DiffBlock } from '../../components/DiffBlock'
import { RoleBadge } from '../../components/RoleBadge'
import { ROLE_INFO } from '../../domain/roles'
import type { SessionEntry } from '../../domain/types'

const TOOL_COLUMN_WIDTH = 64

/** Session Log 的一筆工具呼叫：工具標籤、參數、Auto 角色標記、輸出或 diff。 */
export function ToolCallRow({ entry }: { entry: SessionEntry }) {
  const role = ROLE_INFO[entry.autoRole]
  return (
    <Box
      sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}
      data-testid={`tool-call-${entry.id}`}
    >
      <Typography
        variant="code11"
        sx={(theme) => ({
          width: TOOL_COLUMN_WIDTH,
          flexShrink: 0,
          color: theme.vars.palette.role[role.themeName].text,
        })}
      >
        {entry.tool}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Typography variant="code12" color="text.secondary">
            {entry.argument}
          </Typography>
          {entry.meta && (
            <Typography variant="code10" color={entry.diff ? 'success.main' : 'text.subtle'}>
              {entry.meta}
            </Typography>
          )}
          {entry.status === 'running' && (
            <Typography variant="code10" color="primary.light">
              running
            </Typography>
          )}
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <RoleBadge role={entry.autoRole} label={`Auto: ${role.englishLabel}`} />
            {entry.roleSwitched && (
              <ArrowUpwardIcon aria-label="角色自動提升" sx={{ fontSize: 'inherit' }} />
            )}
          </Box>
        </Box>
        {entry.output && (
          <Box
            sx={(theme) => ({
              padding: theme.spacing(2, 3),
              borderRadius: theme.layout.radius.button,
              backgroundColor: theme.vars.palette.background.inset,
            })}
          >
            {entry.output.map((line) => (
              <Typography key={line} variant="code11" color="text.muted" component="div">
                {line}
              </Typography>
            ))}
          </Box>
        )}
        {entry.diff && <DiffBlock lines={entry.diff} />}
      </Box>
    </Box>
  )
}
