import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'

import App from './App.tsx'
import { store } from './app/store'
import { healthRequested } from './features/server/serverSlice'
import { DEFAULT_COLOR_MODE, theme } from './theme'
import './theme/fonts'

// 啟動時檢查一次後端連線，結果顯示在側欄底部。
store.dispatch(healthRequested())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme} defaultMode={DEFAULT_COLOR_MODE} storageManager={null}>
        <CssBaseline enableColorScheme />
        <App />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
