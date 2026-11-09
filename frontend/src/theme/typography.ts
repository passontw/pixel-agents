import type { TypographyVariantsOptions } from '@mui/material/styles'

export const UI_FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif"
export const CODE_FONT = "'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace"

const code = (size: number) => ({
  fontFamily: CODE_FONT,
  fontSize: `${size}px`,
  fontWeight: 400,
  lineHeight: 1.5,
})

// 字階依 Style Guide：Inter 9/10/11/12/13/14/15、JetBrains Mono 10/11/12/13。
export const typography: TypographyVariantsOptions = {
  fontFamily: UI_FONT,
  h1: { fontSize: '15px', fontWeight: 600, lineHeight: 1.4 },
  h2: { fontSize: '14px', fontWeight: 600, lineHeight: 1.4 },
  body1: { fontSize: '13px', fontWeight: 400, lineHeight: 1.5 },
  body2: { fontSize: '12px', fontWeight: 400, lineHeight: 1.5 },
  caption: { fontSize: '11px', fontWeight: 400, lineHeight: 1.5 },
  overline: {
    fontSize: '10px',
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  button: { fontSize: '12px', fontWeight: 500, textTransform: 'none', lineHeight: 1.5 },
  badge: { fontSize: '9px', fontWeight: 500, lineHeight: 1.4 },
  code10: code(10),
  code11: code(11),
  code12: code(12),
  code13: code(13),
}
