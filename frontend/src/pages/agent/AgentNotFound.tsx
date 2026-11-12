import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router'

import { paths } from '../../app/paths'

export function AgentNotFound() {
  return (
    <Box sx={{ m: 'auto', textAlign: 'center' }}>
      <Typography variant="h1" component="h1">
        找不到這個 Agent
      </Typography>
      <Button
        component={Link}
        to={paths.dashboard}
        variant="outlined"
        color="inherit"
        sx={{ mt: 3 }}
      >
        回到 Dashboard
      </Button>
    </Box>
  )
}
