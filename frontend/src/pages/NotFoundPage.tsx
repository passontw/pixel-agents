import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router'

import { paths } from '../app/paths'

export function NotFoundPage() {
  return (
    <Box sx={{ m: 'auto', textAlign: 'center' }}>
      <Typography variant="h1" component="h1">
        找不到頁面
      </Typography>
      <Typography variant="body2" color="text.muted" sx={{ my: 2 }}>
        這個網址沒有對應的頁面。
      </Typography>
      <Button component={Link} to={paths.dashboard} variant="outlined" color="inherit">
        回到 Dashboard
      </Button>
    </Box>
  )
}
