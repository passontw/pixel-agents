import AddIcon from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { AgentListItem } from '../../components/AgentListItem'
import { RoleBadge } from '../../components/RoleBadge'
import { StatusDot } from '../../components/StatusDot'
import { ROLE_CODES } from '../../domain/roles'
import type { AgentStatus } from '../../domain/types'
import { Section } from './ColorSections'
import { useSchemePalette } from './useSchemePalette'

const STATUS_NOTES: Record<AgentStatus, string> = {
  running: 'Running · glow',
  waiting: 'Waiting · input',
  idle: 'Idle · no glow',
}
const TYPE_SCALE = ['h1', 'h2', 'body1', 'body2', 'caption', 'overline', 'badge'] as const
const CODE_SCALE = ['code10', 'code11', 'code12', 'code13'] as const

export function ComponentSections() {
  const { theme } = useSchemePalette()
  const { layout } = theme
  return (
    <>
      <Section title="Typography">
        {TYPE_SCALE.map((variant) => (
          <Typography key={variant} variant={variant} component="div">
            {`${variant} · ${theme.typography[variant].fontSize}`}
          </Typography>
        ))}
        {CODE_SCALE.map((variant) => (
          <Typography key={variant} variant={variant} component="div">
            {`${variant} · ${theme.typography[variant].fontSize}`}
          </Typography>
        ))}
      </Section>
      <Section title="Role Badges">
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {ROLE_CODES.map((role) => (
            <RoleBadge key={role} role={role} variant="full" />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {ROLE_CODES.map((role) => (
            <RoleBadge key={role} role={role} />
          ))}
        </Box>
      </Section>
      <Section title="Status Dots">
        {(Object.keys(STATUS_NOTES) as AgentStatus[]).map((status) => (
          <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.5 }}>
            <StatusDot status={status} size="card" />
            <Typography variant="caption">{STATUS_NOTES[status]}</Typography>
          </Box>
        ))}
      </Section>
      <Section title="Sidebar Agent States">
        <AgentListItem
          agentId="style-guide-default"
          name="agent-name"
          status="running"
          roles={['E']}
          detail="running · 1m 20s"
        />
        <AgentListItem
          agentId="style-guide-kb"
          name="agent-name"
          status="idle"
          roles={['W']}
          detail="KB Writer · 2 pending"
          isKbWriter
        />
      </Section>
      <Section title="Buttons & Inputs">
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <Button variant="contained">Primary</Button>
          <Button variant="contained" color="success">
            核准
          </Button>
          <Button variant="outlined" color="inherit">
            Outline
          </Button>
          <Button variant="outlined" color="error">
            拒絕
          </Button>
          <Button variant="dashed" startIcon={<AddIcon />}>
            New Agent
          </Button>
          <Switch defaultChecked slotProps={{ input: { 'aria-label': 'switch on' } }} />
          <Switch slotProps={{ input: { 'aria-label': 'switch off' } }} />
        </Box>
        <TextField fullWidth placeholder="input field placeholder" sx={{ mb: 2 }} />
        <TextField fullWidth defaultValue="focused input" autoFocus={false} />
      </Section>
      <Section title="Layout Tokens">
        <Typography variant="code11" component="div">{`border radius: ${Object.entries(
          layout.radius,
        )
          .map(([k, px]) => `${k} ${px}px`)
          .join(' · ')}`}</Typography>
        <Typography
          variant="code11"
          component="div"
        >{`bar heights: status ${layout.statusBarHeight} · tab ${layout.tabBarHeight} · context ${layout.contextBarHeight} · header ${layout.headerHeight}`}</Typography>
        <Typography
          variant="code11"
          component="div"
        >{`sidebar width: ${layout.sidebarWidth}px · content padding: ${layout.contentPadding.compact}-${layout.contentPadding.regular}px`}</Typography>
      </Section>
    </>
  )
}
