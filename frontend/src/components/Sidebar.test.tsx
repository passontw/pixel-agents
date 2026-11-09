import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { kbRequestsApproveAll } from '../features/kb/kbSlice'
import { renderApp } from '../test/renderApp'

const sidebar = () => screen.getByRole('navigation', { name: '側欄' })

describe('Sidebar 接上 Redux state', () => {
  it('顯示目前工作空間的 Agent 數與清單', () => {
    renderApp('/')
    expect(within(sidebar()).getByText('Agents · 3')).toBeTruthy()
    expect(within(sidebar()).getByRole('link', { name: /passontw-spec/ })).toBeTruthy()
  })

  it('KB Writer 顯示 W 徽章與 pending 數', () => {
    renderApp('/')
    const pixel = within(sidebar()).getByRole('link', { name: /passontw-pixel/ })
    expect(within(pixel).getByText('W')).toBeTruthy()
    expect(within(pixel).getByText('KB Writer · 2 pending')).toBeTruthy()
  })

  it('有 KB Writer 的工作空間顯示 KB Review 入口與待審數量徽章', () => {
    renderApp('/')
    const entry = within(sidebar()).getByRole('link', { name: /KB Review/ })
    expect(within(entry).getByText('2')).toBeTruthy()
  })

  it('核准全部後待審數量徽章更新為 0', async () => {
    const { store } = renderApp('/')
    store.dispatch(kbRequestsApproveAll())
    const entry = await within(sidebar()).findByRole('link', { name: /KB Review/ })
    expect(within(entry).getByText('0')).toBeTruthy()
  })

  it('切換到沒有 KB Writer 的工作空間：只列出該工作空間的 Agent，隱藏 KB Review', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await user.click(within(sidebar()).getByRole('combobox', { name: '工作空間' }))
    await user.click(await screen.findByRole('option', { name: /personal/ }))
    expect(within(sidebar()).getByText('Agents · 1')).toBeTruthy()
    expect(within(sidebar()).getByRole('link', { name: /personal-notes/ })).toBeTruthy()
    expect(within(sidebar()).queryByRole('link', { name: /KB Review/ })).toBeNull()
  })

  it('New Agent 導向 /agents/new', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/')
    await user.click(within(sidebar()).getByRole('link', { name: /New Agent/ }))
    expect(router.state.location.pathname).toBe('/agents/new')
  })
})
