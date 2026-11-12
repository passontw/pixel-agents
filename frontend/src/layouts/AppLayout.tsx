import Box from '@mui/material/Box'
import { Outlet } from 'react-router'

import { Sidebar } from '../components/Sidebar'

/** 共用版面：左側欄加上各頁面的 Outlet。 */
export function AppLayout() {
  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: theme.vars.palette.background.default,
      })}
    >
      <Sidebar />
      <Box component="main" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
