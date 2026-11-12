import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Typography from '@mui/material/Typography'

import { useAppSelector } from '../../app/hooks'
import { StatusDot } from '../../components/StatusDot'
import { selectAgents } from '../../features/agents/selectors'
import type { Workspace } from '../../domain/types'

interface WorkspaceStepProps {
  workspaces: Workspace[]
  selectedId: string
  onSelect: (workspaceId: string) => void
  onAdd: () => void
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="overline" component="div" color="text.ghost">
        {label}
      </Typography>
      <Typography variant="code11" color="text.secondary">
        {value}
      </Typography>
    </Box>
  )
}

/** 步驟 1：選擇工作空間（選取的顯示詳情）。 */
export function WorkspaceStep({ workspaces, selectedId, onSelect, onAdd }: WorkspaceStepProps) {
  const agents = useAppSelector(selectAgents)

  return (
    <Box
      role="radiogroup"
      aria-label="工作空間"
      sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
    >
      {workspaces.map((workspace) => {
        const members = agents.filter((agent) => agent.workspaceId === workspace.id)
        const writer = members.find((agent) => agent.isKbWriter)
        const selected = workspace.id === selectedId
        return (
          <ButtonBase
            key={workspace.id}
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(workspace.id)}
            sx={(theme) => ({
              display: 'block',
              textAlign: 'left',
              padding: theme.spacing(3.5, 4),
              borderRadius: theme.layout.radius.workspace,
              border: `1px solid ${selected ? theme.vars.palette.primary.main : theme.vars.palette.border.strong}`,
              backgroundColor: selected
                ? theme.vars.palette.action.selected
                : theme.vars.palette.background.inset,
            })}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <StatusDot status="running" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {workspace.name}
                </Typography>
                <Typography variant="code10" color="text.subtle">
                  {workspace.path}
                </Typography>
              </Box>
              {selected ? (
                <CheckIcon fontSize="small" color="primary" />
              ) : (
                <Typography variant="caption" color="text.subtle">
                  {`${members.length} agent · ${writer ? 'KB Writer' : '無 KB Writer'}`}
                </Typography>
              )}
            </Box>
            {selected && (
              <Box sx={{ mt: 3, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <Detail label="Agents" value={`${members.length} 個`} />
                <Detail label="KB Writer" value={writer?.name ?? '無'} />
                <Detail label="知識庫" value={workspace.kbPath} />
              </Box>
            )}
          </ButtonBase>
        )
      })}
      <ButtonBase
        onClick={onAdd}
        sx={(theme) => ({
          gap: 2,
          padding: theme.spacing(3, 4),
          justifyContent: 'flex-start',
          color: theme.vars.palette.text.subtle,
          borderRadius: theme.layout.radius.workspace,
          border: `1px dashed ${theme.vars.palette.border.strong}`,
        })}
      >
        <AddIcon fontSize="small" />
        <Typography variant="body2">新增工作空間…</Typography>
      </ButtonBase>
    </Box>
  )
}
