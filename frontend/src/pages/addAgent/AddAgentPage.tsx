import CloseIcon from '@mui/icons-material/Close'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { paths } from '../../app/paths'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { PageHeader } from '../../components/PageHeader'
import type { PermissionRole } from '../../domain/types'
import { agentLaunchRequested, agentLaunchReset } from '../../features/agents/agentsSlice'
import {
  selectAgents,
  selectKbWriterOfWorkspace,
  selectLaunchState,
} from '../../features/agents/selectors'
import {
  selectSelectedWorkspace,
  selectWorkspaces,
  workspaceSelected,
} from '../../features/workspaces/workspacesSlice'
import { AddWorkspaceDialog } from './AddWorkspaceDialog'
import { KbPermissionStep } from './KbPermissionStep'
import { RolesStep } from './RolesStep'
import { hasErrors, validateAddAgentForm } from './validation'
import { WorkspaceStep } from './WorkspaceStep'

function StepTitle({ children }: { children: string }) {
  return (
    <Typography variant="h2" component="h2" sx={{ mb: 3 }}>
      {children}
    </Typography>
  )
}

export function AddAgentPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const workspaces = useAppSelector(selectWorkspaces)
  const workspace = useAppSelector(selectSelectedWorkspace)
  const agents = useAppSelector(selectAgents)
  const launch = useAppSelector(selectLaunchState)
  const workspaceId = workspace?.id ?? ''
  const currentWriter = useAppSelector((state) => selectKbWriterOfWorkspace(state, workspaceId))

  const [name, setName] = useState('')
  const [roles, setRoles] = useState<Record<PermissionRole, boolean>>({
    R: true,
    E: false,
    D: false,
  })
  const [isKbWriter, setIsKbWriter] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const errors = validateAddAgentForm(
    { name, workspaceId, roles, isKbWriter },
    agents.map((agent) => agent.name),
  )
  const launching = launch.status === 'launching'

  // 進入頁面時清掉上一次的啟動結果。
  useEffect(() => {
    dispatch(agentLaunchReset())
  }, [dispatch])

  // 啟動成功後導向新 Agent 頁。
  useEffect(() => {
    if (launch.status === 'succeeded' && launch.launchedAgentId) {
      navigate(paths.agent(launch.launchedAgentId))
    }
  }, [launch.status, launch.launchedAgentId, navigate])

  const submit = () => {
    setSubmitted(true)
    if (hasErrors(errors) || launching) return
    dispatch(
      agentLaunchRequested({
        name: name.trim(),
        workspaceId,
        permissionRoles: (Object.keys(roles) as PermissionRole[]).filter((role) => roles[role]),
        isKbWriter,
      }),
    )
  }

  return (
    <>
      <PageHeader
        title="新增 Agent"
        subtitle={workspace ? `到 ${workspace.name} 工作空間` : undefined}
        actions={
          <IconButton aria-label="關閉" onClick={() => navigate(paths.dashboard)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
      <Box
        component="form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
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
          <StepTitle>1. 選擇工作空間</StepTitle>
          <WorkspaceStep
            workspaces={workspaces}
            selectedId={workspaceId}
            onSelect={(id) => dispatch(workspaceSelected(id))}
            onAdd={() => setDialogOpen(true)}
          />
          <TextField
            fullWidth
            label="Agent 名稱"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={submitted && Boolean(errors.name)}
            helperText={submitted ? errors.name : undefined}
            sx={{ mt: 4 }}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Box>
            <StepTitle>2. 指派 Roles</StepTitle>
            <Typography variant="caption" color="text.subtle" component="p" sx={{ mt: -2, mb: 3 }}>
              Claude Code 執行時將依工具類型自動套用對應 role
            </Typography>
            <RolesStep
              roles={roles}
              error={submitted ? errors.roles : undefined}
              onToggle={(role, enabled) => setRoles((prev) => ({ ...prev, [role]: enabled }))}
            />
          </Box>
          <Box>
            <StepTitle>3. 知識庫權限</StepTitle>
            <KbPermissionStep
              isKbWriter={isKbWriter}
              currentWriterName={currentWriter?.name}
              onChange={setIsKbWriter}
            />
          </Box>
          {launch.status === 'failed' && <Alert severity="error">{launch.error}</Alert>}
          <Button
            type="submit"
            variant="contained"
            size="medium"
            disabled={launching}
            startIcon={launching ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {launching ? '啟動中…' : `新增到 ${workspace?.name ?? ''} 工作空間`}
          </Button>
        </Box>
      </Box>
      <AddWorkspaceDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}
