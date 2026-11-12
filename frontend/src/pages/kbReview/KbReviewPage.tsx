import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { Link, useSearchParams } from 'react-router'

import { DEFAULT_KB_TAB, KB_TAB_PARAM, KB_TABS } from '../../app/paths'
import type { KbTabValue } from '../../app/paths'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { AgentStatusBar } from '../../components/AgentStatusBar'
import { PageHeader } from '../../components/PageHeader'
import { selectAgents, selectKbWriterOfWorkspace } from '../../features/agents/selectors'
import {
  kbRequestApproved,
  kbRequestRejected,
  kbRequestsApproveAll,
} from '../../features/kb/kbSlice'
import { selectKbRequestCounts, selectKbRequestsByStatus } from '../../features/kb/selectors'
import { selectSelectedWorkspace } from '../../features/workspaces/workspacesSlice'
import { useNow } from '../../hooks/useNow'
import { KbRequestCard } from './KbRequestCard'

const EMPTY_TEXT: Record<KbTabValue, string> = {
  pending: '沒有待審核的請求',
  approved: '還沒有已核准的請求',
  rejected: '沒有已拒絕的請求',
}

function isKbTab(value: string | null): value is KbTabValue {
  return KB_TABS.some((tab) => tab.value === value)
}

export function KbReviewPage() {
  const dispatch = useAppDispatch()
  const now = useNow()
  const [searchParams] = useSearchParams()
  const requested = searchParams.get(KB_TAB_PARAM)
  const tab: KbTabValue = isKbTab(requested) ? requested : DEFAULT_KB_TAB

  const workspace = useAppSelector(selectSelectedWorkspace)
  const workspaceId = workspace?.id ?? ''
  const agents = useAppSelector(selectAgents)
  const writer = useAppSelector((state) => selectKbWriterOfWorkspace(state, workspaceId))
  const counts = useAppSelector((state) => selectKbRequestCounts(state, workspaceId))
  const visible = useAppSelector((state) => selectKbRequestsByStatus(state, workspaceId, tab))
  const pending = useAppSelector((state) => selectKbRequestsByStatus(state, workspaceId, 'pending'))

  const canReview = Boolean(writer)

  return (
    <>
      <PageHeader
        title="知識庫寫入審核"
        subtitle={
          workspace
            ? `${workspace.name} 工作空間 · ${writer ? `由 ${writer.name} (KB Writer) 審核` : '尚未指派 KB Writer'}`
            : undefined
        }
        actions={
          <Button
            variant="outlined"
            color="success"
            disabled={!canReview || pending.length === 0}
            onClick={() => dispatch(kbRequestsApproveAll({ requestIds: pending.map((r) => r.id) }))}
          >
            全部核准
          </Button>
        }
      />
      <Tabs value={tab} aria-label="KB 審核分頁">
        {KB_TABS.map((item) => (
          <Tab
            key={item.value}
            value={item.value}
            component={Link}
            to={{ search: item.value === DEFAULT_KB_TAB ? '' : `?${KB_TAB_PARAM}=${item.value}` }}
            label={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
                {item.label}
                <Chip
                  color={item.value === 'pending' ? 'error' : 'default'}
                  label={counts[item.value]}
                />
              </Box>
            }
          />
        ))}
      </Tabs>
      <Box
        sx={(theme) => ({
          flex: 1,
          overflowY: 'auto',
          padding: `${theme.layout.contentPadding.compact}px ${theme.layout.contentPadding.regular}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        })}
      >
        {!canReview && <Alert severity="warning">這個工作空間尚未指派 KB Writer，無法審核。</Alert>}
        {visible.length === 0 && (
          <Typography variant="body2" color="text.subtle">
            {EMPTY_TEXT[tab]}
          </Typography>
        )}
        {visible.map((request) => (
          <KbRequestCard
            key={request.id}
            request={request}
            agent={agents.find((agent) => agent.id === request.agentId)}
            now={now}
            canReview={canReview}
            onApprove={() => dispatch(kbRequestApproved({ requestId: request.id }))}
            onReject={() => dispatch(kbRequestRejected({ requestId: request.id }))}
          />
        ))}
      </Box>
      <AgentStatusBar
        items={[`${workspace?.name ?? ''} / knowledge-base/`, `KB Writer: ${writer?.name ?? '—'}`]}
        endItems={[
          `${counts.pending} pending · ${counts.approved} approved · ${counts.rejected} rejected`,
        ]}
      />
    </>
  )
}
