import { ThemeProvider } from '@mui/material/styles'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { createAppStore } from '../app/store'
import type { AppStore } from '../app/store'
import { routes } from '../app/routes'
import { DEFAULT_COLOR_MODE, theme } from '../theme'

/** 以完整路由表與新的 store 渲染應用程式，從指定網址開始。 */
export function renderApp(initialPath = '/', store: AppStore = createAppStore()) {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] })
  const result = render(
    <Provider store={store}>
      <ThemeProvider theme={theme} defaultMode={DEFAULT_COLOR_MODE} storageManager={null}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </Provider>,
  )
  return { ...result, router, store }
}

/** 只套用 Provider 與 theme，供元件單獨測試。 */
export function renderWithProviders(ui: ReactElement, store: AppStore = createAppStore()) {
  return {
    store,
    ...render(
      <Provider store={store}>
        <ThemeProvider theme={theme} defaultMode={DEFAULT_COLOR_MODE} storageManager={null}>
          {ui}
        </ThemeProvider>
      </Provider>,
    ),
  }
}
