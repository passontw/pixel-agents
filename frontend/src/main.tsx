import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'

import App from './App.tsx'
import { store } from './app/store'
import { DEFAULT_COLOR_MODE, theme } from './theme'
import './theme/fonts'

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
