import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderApp } from '../test/renderApp'

describe('路由煙霧測試', () => {
  it.each([
    ['/', 'weiyun'],
    ['/agents/new', '新增 Agent'],
    ['/agents/passontw-backend/terminal', 'Terminal'],
    ['/kb/review', '知識庫寫入審核'],
    ['/style-guide', 'Style Guide'],
  ])('%s 渲染出標題 %s', (path, title) => {
    renderApp(path)
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeTruthy()
  })

  it('/agents/:agentId 預設導向 log 分頁', () => {
    const { router } = renderApp('/agents/passontw-backend')
    expect(router.state.location.pathname).toBe('/agents/passontw-backend/log')
    expect(screen.getByRole('tab', { name: 'Session Log' }).getAttribute('aria-selected')).toBe(
      'true',
    )
  })

  it('分頁以路由切換並正確反白', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/agents/passontw-backend/log')
    await user.click(screen.getByRole('tab', { name: 'Files Changed' }))
    expect(router.state.location.pathname).toBe('/agents/passontw-backend/files')
    expect(screen.getByRole('tab', { name: 'Files Changed' }).getAttribute('aria-selected')).toBe(
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Session Log' }).getAttribute('aria-selected')).toBe(
      'false',
    )
    await user.click(screen.getByRole('tab', { name: 'Role Activity' }))
    expect(router.state.location.pathname).toBe('/agents/passontw-backend/roles')
  })

  it('找不到的網址顯示 404', () => {
    renderApp('/no/such/page')
    expect(screen.getByRole('heading', { name: '找不到頁面' })).toBeTruthy()
  })

  it('側欄在每個頁面都存在，目前的 Agent 反白', () => {
    renderApp('/agents/passontw-backend/log')
    const sidebar = screen.getByRole('navigation', { name: '側欄' })
    const link = within(sidebar).getByRole('link', { name: /passontw-backend/ })
    expect(link.getAttribute('aria-current')).toBe('page')
  })
})
