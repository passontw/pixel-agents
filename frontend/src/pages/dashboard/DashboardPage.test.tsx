import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderApp } from '../../test/renderApp'

const card = (agentId: string) => screen.getByTestId(`agent-card-${agentId}`)

describe('Dashboard', () => {
  it('摘要列顯示 Agent 數、各狀態數與 KB Writer', () => {
    renderApp('/')
    expect(screen.getByText(/3 agents · 1 running · 1 waiting · 1 idle/)).toBeTruthy()
    expect(screen.getByText(/KB Writer: passontw-pixel/)).toBeTruthy()
  })

  it('摘要列的 KB Review 連結帶待審數，指向 /kb/review', () => {
    renderApp('/')
    const main = screen.getByRole('main')
    const link = within(main).getByRole('link', { name: /KB Review/ })
    expect(link.getAttribute('href')).toBe('/kb/review')
    expect(within(link).getByText('2')).toBeTruthy()
  })

  it('每個 Agent 一張卡片，running 卡片顯示目前工具與計時', () => {
    renderApp('/')
    const backend = within(card('passontw-backend'))
    expect(backend.getByText('src/routes/agent.ts')).toBeTruthy()
    expect(backend.getByText('npm run typecheck')).toBeTruthy()
    expect(backend.getByText('running')).toBeTruthy()
    expect(backend.getAllByText('Edit')).toHaveLength(2)
  })

  it('waiting 卡片顯示 KB 寫入請求提示並連到審核頁', () => {
    renderApp('/')
    const spec = within(card('passontw-spec'))
    expect(spec.getByText('KB 寫入請求待審核')).toBeTruthy()
    expect(spec.getByRole('link', { name: 'Review' }).getAttribute('href')).toBe('/kb/review')
  })

  it('idle 卡片顯示最後活動與待審 KB 數', () => {
    renderApp('/')
    const pixel = within(card('passontw-pixel'))
    expect(pixel.getByText('無近期活動')).toBeTruthy()
    expect(pixel.getByText('Last active 23m ago')).toBeTruthy()
    expect(pixel.getByText('2 pending KB reviews')).toBeTruthy()
  })

  it('Terminal 連結導向該 Agent 的 terminal', () => {
    renderApp('/')
    const link = within(card('passontw-backend')).getByRole('link', { name: 'Terminal' })
    expect(link.getAttribute('href')).toBe('/agents/passontw-backend/terminal')
  })

  it('更多選單的「停止」觸發 agentStopRequested', async () => {
    const user = userEvent.setup()
    const { store } = renderApp('/')
    await user.click(within(card('passontw-backend')).getByRole('button', { name: /更多操作/ }))
    await user.click(await screen.findByRole('menuitem', { name: '停止' }))
    expect(store.getState().agents.stoppingIds).toEqual(['passontw-backend'])
  })

  it('idle 的 Agent 不能停止', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await user.click(within(card('passontw-pixel')).getByRole('button', { name: /更多操作/ }))
    expect(
      (await screen.findByRole('menuitem', { name: '停止' })).getAttribute('aria-disabled'),
    ).toBe('true')
  })

  it('+ Agent 與新增卡片都導向 /agents/new', () => {
    renderApp('/')
    const main = screen.getByRole('main')
    expect(within(main).getByRole('link', { name: 'Agent' }).getAttribute('href')).toBe(
      '/agents/new',
    )
    expect(
      within(main).getByRole('link', { name: '新增 Agent 到 weiyun' }).getAttribute('href'),
    ).toBe('/agents/new')
  })
})
