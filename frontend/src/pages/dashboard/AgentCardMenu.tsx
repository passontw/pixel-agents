import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { paths } from '../../app/paths'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { agentStopRequested } from '../../features/agents/agentsSlice'
import { selectStoppingIds } from '../../features/agents/selectors'
import type { Agent } from '../../domain/types'

/** 卡片右下角的「···」選單：查看詳情、停止。 */
export function AgentCardMenu({ agent }: { agent: Agent }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const stopping = useAppSelector(selectStoppingIds).includes(agent.id)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const close = () => setAnchor(null)

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        aria-label={`${agent.name} 更多操作`}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <MoreHorizIcon fontSize="inherit" />
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <MenuItem
          onClick={() => {
            close()
            navigate(paths.agent(agent.id))
          }}
        >
          查看詳情
        </MenuItem>
        <MenuItem
          disabled={agent.status === 'idle' || stopping}
          onClick={() => {
            close()
            dispatch(agentStopRequested({ agentId: agent.id }))
          }}
        >
          停止
        </MenuItem>
      </Menu>
    </>
  )
}
