import Box from '@mui/material/Box'

import { PageHeader } from '../../components/PageHeader'
import { ColorSections } from './ColorSections'
import { ComponentSections } from './ComponentSections'
import { useSchemePalette } from './useSchemePalette'

/** Style Guide：內容全部讀 theme，本頁同時是 theme 的實際展示。 */
export function StyleGuidePage() {
  const { scheme } = useSchemePalette()
  return (
    <>
      <PageHeader title="Style Guide" subtitle={`目前色彩模式：${scheme}`} />
      <Box
        sx={(theme) => ({
          flex: 1,
          overflowY: 'auto',
          padding: `${theme.layout.contentPadding.compact}px ${theme.layout.contentPadding.regular}px`,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 8,
          alignContent: 'start',
        })}
      >
        <Box>
          <ColorSections />
        </Box>
        <Box>
          <ComponentSections />
        </Box>
      </Box>
    </>
  )
}
