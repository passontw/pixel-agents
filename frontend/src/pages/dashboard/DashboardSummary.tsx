import AddIcon from '@mui/icons-material/Add'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router'

import { paths } from '../../app/paths'
import { PageHeader } from '../../components/PageHeader'
import type { WorkspaceSummary } from '../../features/agents/selectors'
import type { Agent, Workspace } from '../../domain/types'

interface DashboardSummaryProps {
  workspace: Workspace
  summary: WorkspaceSummary
  kbWriter?: Agent
  pendingCount: number
}

/** Dashboard 頂部摘要列：Agent 數、各狀態數、KB Writer、KB Review 待審數連結、+ Agent。 */
export function DashboardSummary({
  workspace,
  summary,
  kbWriter,
  pendingCount,
}: DashboardSummaryProps) {
  return (
    <PageHeader
      title={workspace.name}
      subtitle={
        <>
          {`${summary.total} agents · ${summary.running} running · ${summary.waiting} waiting · ${summary.idle} idle`}
          {kbWriter && (
            <Typography variant="body2" component="span" color="success.main">
              {` · KB Writer: ${kbWriter.name}`}
            </Typography>
          )}
        </>
      }
      actions={
        <>
          {kbWriter && (
            <Button
              component={Link}
              to={paths.kbReview}
              variant="outlined"
              color="inherit"
              sx={{ gap: 1.5 }}
            >
              KB Review
              <Chip color="error" label={pendingCount} />
            </Button>
          )}
          <Button component={Link} to={paths.newAgent} variant="contained" startIcon={<AddIcon />}>
            Agent
          </Button>
        </>
      }
    />
  )
}
