import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { useState } from 'react'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { selectWorkspaces, workspaceAdded } from '../../features/workspaces/workspacesSlice'

export function AddWorkspaceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch()
  const workspaces = useAppSelector(selectWorkspaces)
  const [name, setName] = useState('')
  const [path, setPath] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const trimmedName = name.trim()
  const nameError = !trimmedName
    ? '請輸入工作空間名稱'
    : workspaces.some((w) => w.name === trimmedName)
      ? '這個名稱已被使用'
      : undefined
  const pathError = path.trim() ? undefined : '請輸入工作空間路徑'

  const submit = () => {
    setSubmitted(true)
    if (nameError || pathError) return
    dispatch(workspaceAdded({ name: trimmedName, path: path.trim() }))
    setName('')
    setPath('')
    setSubmitted(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>新增工作空間</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
        <TextField
          label="名稱"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={submitted && Boolean(nameError)}
          helperText={submitted ? nameError : undefined}
          autoFocus
        />
        <TextField
          label="路徑"
          value={path}
          onChange={(event) => setPath(event.target.value)}
          error={submitted && Boolean(pathError)}
          helperText={submitted ? pathError : '例如 ~/projects/demo'}
        />
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          取消
        </Button>
        <Button variant="contained" onClick={submit}>
          新增
        </Button>
      </DialogActions>
    </Dialog>
  )
}
