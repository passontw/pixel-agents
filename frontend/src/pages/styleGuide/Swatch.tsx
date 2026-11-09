import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface SwatchProps {
  /** CSS 變數參照，例如 theme.vars.palette.primary.main */
  cssColor: string
  /** 顯示用的實際色值 */
  value: string
  name: string
  note?: string
}

export function Swatch({ cssColor, value, name, note }: SwatchProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, py: 1 }}>
      <Box
        data-testid="swatch"
        sx={(theme) => ({
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: theme.layout.radius.input,
          border: `1px solid ${theme.vars.palette.border.strong}`,
          backgroundColor: cssColor,
        })}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="code11" component="div">
          {value}
        </Typography>
        <Typography variant="caption" color="text.subtle" component="div">
          {note ? `${name} · ${note}` : name}
        </Typography>
      </Box>
    </Box>
  )
}
