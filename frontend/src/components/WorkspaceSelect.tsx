import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'

import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  selectSelectedWorkspaceId,
  selectWorkspaces,
  workspaceSelected,
} from '../features/workspaces/workspacesSlice'
import { StatusDot } from './StatusDot'
import { SidebarLabel } from './SidebarParts'

/** 側欄的工作空間下拉。 */
export function WorkspaceSelect() {
  const dispatch = useAppDispatch()
  const workspaces = useAppSelector(selectWorkspaces)
  const selectedId = useAppSelector(selectSelectedWorkspaceId)

  return (
    <Box sx={{ padding: (theme) => theme.spacing(3, 3, 2) }}>
      <Box sx={{ mb: 1.5 }}>
        <SidebarLabel>工作空間</SidebarLabel>
      </Box>
      <Select
        fullWidth
        value={selectedId}
        onChange={(event) => dispatch(workspaceSelected(event.target.value))}
        inputProps={{ 'aria-label': '工作空間' }}
        sx={(theme) => ({
          backgroundColor: theme.vars.palette.background.inset,
          borderRadius: theme.layout.radius.input,
          ...theme.typography.body1,
          fontWeight: 500,
          '& fieldset': { borderColor: theme.vars.palette.border.strong },
        })}
      >
        {workspaces.map((workspace) => (
          <MenuItem key={workspace.id} value={workspace.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <StatusDot status="running" />
              {workspace.name}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </Box>
  )
}
