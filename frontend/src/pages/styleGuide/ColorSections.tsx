import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

import { Swatch } from './Swatch'
import { useSchemePalette } from './useSchemePalette'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ mb: 6 }}>
      <Typography
        variant="overline"
        component="h2"
        color="text.ghost"
        sx={{ display: 'block', mb: 2 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  )
}

export function ColorSections() {
  const { theme, palette } = useSchemePalette()
  const v = theme.vars.palette
  return (
    <>
      <Section title="Surface Colors">
        <Swatch
          cssColor={v.background.default}
          value={palette.background.default}
          name="background.default"
          note="Page background"
        />
        <Swatch
          cssColor={v.background.paper}
          value={palette.background.paper}
          name="background.paper"
          note="Sidebar · bars · cards"
        />
        <Swatch
          cssColor={v.background.inset}
          value={palette.background.inset}
          name="background.inset"
          note="Card body · inputs"
        />
        <Swatch
          cssColor={v.background.deepest}
          value={palette.background.deepest}
          name="background.deepest"
          note="Status bar · diff bg"
        />
        <Swatch
          cssColor={v.background.tag}
          value={palette.background.tag}
          name="background.tag"
          note="Subtle inline tag bg"
        />
      </Section>
      <Section title="Border Colors">
        <Swatch
          cssColor={v.divider}
          value={palette.divider}
          name="divider"
          note="Structural dividers"
        />
        <Swatch
          cssColor={v.border.subtle}
          value={palette.border.subtle}
          name="border.subtle"
          note="Card inner dividers"
        />
        <Swatch
          cssColor={v.border.strong}
          value={palette.border.strong}
          name="border.strong"
          note="Inputs · ghost buttons"
        />
      </Section>
      <Section title="Text Scale">
        {(['primary', 'secondary', 'muted', 'subtle', 'ghost'] as const).map((key) => (
          <Swatch key={key} cssColor={v.text[key]} value={palette.text[key]} name={`text.${key}`} />
        ))}
      </Section>
      <Section title="Brand & Semantic">
        <Swatch
          cssColor={v.primary.main}
          value={palette.primary.main}
          name="primary.main"
          note="Brand purple"
        />
        <Swatch
          cssColor={v.primary.light}
          value={palette.primary.light}
          name="primary.light"
          note="Purple light"
        />
        <Swatch
          cssColor={v.success.main}
          value={palette.success.main}
          name="success.main"
          note="Running · approve"
        />
        <Swatch
          cssColor={v.warning.main}
          value={palette.warning.main}
          name="warning.main"
          note="Waiting · KB request"
        />
        <Swatch
          cssColor={v.error.main}
          value={palette.error.main}
          name="error.main"
          note="Danger · reject"
        />
        <Swatch cssColor={v.info.main} value={palette.info.main} name="info.main" />
      </Section>
    </>
  )
}
