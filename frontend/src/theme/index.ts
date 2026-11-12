import { createTheme } from '@mui/material/styles'

import { components } from './components'
import { layout } from './layout'
import { darkPalette, lightPalette } from './palettes'
import { typography } from './typography'
import './types'

export { DEFAULT_COLOR_MODE } from './colorMode'
export type { ColorMode } from './colorMode'
export { CODE_FONT, UI_FONT } from './typography'
export type { RoleName, StatusName } from './types'

const SPACING_UNIT_PX = 4

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data' },
  colorSchemes: {
    light: { palette: lightPalette },
    dark: { palette: darkPalette },
  },
  spacing: SPACING_UNIT_PX,
  shape: { borderRadius: layout.radius.button },
  typography,
  layout,
  components,
})
