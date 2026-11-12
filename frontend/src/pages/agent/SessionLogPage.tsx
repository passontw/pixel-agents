import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useParams } from 'react-router'

import { useAppSelector } from '../../app/hooks'
import {
  selectAgentById,
  selectAgentDetails,
  selectKbWriterOfWorkspace,
} from '../../features/agents/selectors'
import { selectPendingKbRequestsOfAgent } from '../../features/kb/selectors'
import { KbRequestBanner } from './KbRequestBanner'
import { ToolCallRow } from './ToolCallRow'

export function SessionLogPage() {
  const { agentId } = useParams()
  const agent = useAppSelector((state) => selectAgentById(state, agentId))
  const { sessionLog } = useAppSelector((state) => selectAgentDetails(state, agentId))
  const pending = useAppSelector((state) => selectPendingKbRequestsOfAgent(state, agentId))
  const writer = useAppSelector((state) =>
    agent ? selectKbWriterOfWorkspace(state, agent.workspaceId) : undefined,
  )

  return (
    <Box
      sx={(theme) => ({
        padding: `${theme.layout.contentPadding.compact}px ${theme.layout.contentPadding.regular}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      })}
    >
      {sessionLog.length === 0 && (
        <Typography variant="body2" color="text.subtle">
          尚無工具呼叫紀錄
        </Typography>
      )}
      {sessionLog.map((entry) => (
        <ToolCallRow key={entry.id} entry={entry} />
      ))}
      {agent &&
        pending.map((request) => (
          <KbRequestBanner
            key={request.id}
            agent={agent}
            request={request}
            writerName={writer?.name}
          />
        ))}
    </Box>
  )
}
