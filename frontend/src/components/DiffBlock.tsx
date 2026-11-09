import Box from '@mui/material/Box'

import type { DiffLine } from '../domain/types'

const PREFIX: Record<DiffLine['kind'], string> = {
  add: '+ ',
  remove: '- ',
  context: '  ',
  hunk: '',
}

/** diff 區塊：新增綠、刪除紅、@@ 標頭淡色。 */
export function DiffBlock({ lines }: { lines: DiffLine[] }) {
  return (
    <Box
      component="pre"
      aria-label="diff"
      sx={(theme) => ({
        ...theme.typography.code11,
        m: 0,
        padding: theme.spacing(2, 0),
        overflowX: 'auto',
        borderRadius: theme.layout.radius.button,
        backgroundColor: theme.vars.palette.background.deepest,
        border: `1px solid ${theme.vars.palette.border.subtle}`,
      })}
    >
      {lines.map((line, index) => (
        <Box
          key={index}
          component="div"
          data-diff={line.kind}
          sx={(theme) => ({
            padding: theme.spacing(0, 3),
            whiteSpace: 'pre',
            color:
              line.kind === 'add'
                ? theme.vars.palette.success.main
                : line.kind === 'remove'
                  ? theme.vars.palette.error.main
                  : line.kind === 'hunk'
                    ? theme.vars.palette.text.subtle
                    : theme.vars.palette.text.muted,
            backgroundColor:
              line.kind === 'add'
                ? theme.alpha(theme.vars.palette.success.main, 0.08)
                : line.kind === 'remove'
                  ? theme.alpha(theme.vars.palette.error.main, 0.08)
                  : 'transparent',
          })}
        >
          {PREFIX[line.kind] + line.text}
        </Box>
      ))}
    </Box>
  )
}
