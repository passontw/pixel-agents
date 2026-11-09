import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useParams } from 'react-router'

import { useAppSelector } from '../../app/hooks'
import { selectAgentDetails } from '../../features/agents/selectors'

export function FilesChangedPage() {
  const { agentId } = useParams()
  const { filesChanged } = useAppSelector((state) => selectAgentDetails(state, agentId))
  const added = filesChanged.reduce((sum, file) => sum + file.added, 0)
  const removed = filesChanged.reduce((sum, file) => sum + file.removed, 0)

  return (
    <Box
      sx={(theme) => ({
        padding: `${theme.layout.contentPadding.compact}px ${theme.layout.contentPadding.regular}px`,
      })}
    >
      {filesChanged.length === 0 ? (
        <Typography variant="body2" color="text.subtle">
          尚無檔案變更
        </Typography>
      ) : (
        <>
          <Typography variant="caption" color="text.subtle" component="p" sx={{ mb: 3 }}>
            {`${filesChanged.length} 個檔案 · +${added} / -${removed}`}
          </Typography>
          <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
            {filesChanged.map((file) => (
              <Box
                component="li"
                key={file.path}
                sx={(theme) => ({
                  display: 'flex',
                  gap: 3,
                  padding: theme.spacing(2.5, 0),
                  borderBottom: `1px solid ${theme.vars.palette.border.subtle}`,
                })}
              >
                <Typography variant="code12" color="text.secondary" sx={{ flex: 1 }}>
                  {file.path}
                </Typography>
                <Typography variant="code11" color="success.main">{`+${file.added}`}</Typography>
                <Typography variant="code11" color="error.main">{`-${file.removed}`}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}
