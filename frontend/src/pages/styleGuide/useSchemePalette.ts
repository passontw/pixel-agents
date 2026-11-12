import { useColorScheme, useTheme } from '@mui/material/styles'

import { DEFAULT_COLOR_MODE } from '../../theme'

/** 目前色彩 scheme 的實際色票（讀 theme，不寫死）。 */
export function useSchemePalette() {
  const theme = useTheme()
  const { colorScheme } = useColorScheme()
  const scheme = colorScheme ?? DEFAULT_COLOR_MODE
  return { theme, palette: theme.colorSchemes[scheme]!.palette, scheme }
}
