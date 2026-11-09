import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { workspaceSelected } from '../../features/workspaces/workspacesSlice'
import { renderApp } from '../../test/renderApp'

const main = () => screen.getByRole('main')

describe('KB 審核頁', () => {
  it('標題、說明與分頁數量', () => {
    renderApp('/kb/review')
    const page = within(main())
    expect(page.getByRole('heading', { level: 1, name: '知識庫寫入審核' })).toBeTruthy()
    expect(page.getByText('weiyun 工作空間 · 由 passontw-pixel (KB Writer) 審核')).toBeTruthy()
    expect(within(page.getByRole('tab', { name: /待審核/ })).getByText('2')).toBeTruthy()
    expect(within(page.getByRole('tab', { name: /已核准/ })).getByText('5')).toBeTruthy()
    expect(within(page.getByRole('tab', { name: /已拒絕/ })).getByText('1')).toBeTruthy()
    expect(page.getByText('2 pending · 5 approved · 1 rejected')).toBeTruthy()
  })

  it('預設只顯示待審核；請求卡片顯示類型、路徑、diff 與來源上下文', () => {
    renderApp('/kb/review')
    const create = within(screen.getByTestId('kb-request-kb-1'))
    expect(create.getByText('knowledge-base/api-patterns.md')).toBeTruthy()
    expect(create.getByText('提案內容（新增區段）')).toBeTruthy()
    expect(
      create.getByText('在分析 passontw-backend 的 agent.ts 修改時，發現此模式值得記錄。'),
    ).toBeTruthy()
    const update = within(screen.getByTestId('kb-request-kb-2'))
    expect(update.getByText('更新')).toBeTruthy()
    expect(update.getByText('更新差異（現有文件）')).toBeTruthy()
    expect(screen.queryByTestId('kb-request-kb-3')).toBeNull()
  })

  it('核准單一請求：待審減少、已核准增加、側欄徽章同步', async () => {
    const user = userEvent.setup()
    renderApp('/kb/review')
    await user.click(
      within(screen.getByTestId('kb-request-kb-1')).getByRole('button', { name: '核准寫入' }),
    )
    expect(screen.queryByTestId('kb-request-kb-1')).toBeNull()
    expect(within(screen.getByRole('tab', { name: /待審核/ })).getByText('1')).toBeTruthy()
    expect(within(screen.getByRole('tab', { name: /已核准/ })).getByText('6')).toBeTruthy()
    const entry = within(screen.getByRole('navigation', { name: '側欄' })).getByRole('link', {
      name: /KB Review/,
    })
    expect(within(entry).getByText('1')).toBeTruthy()
  })

  it('拒絕請求後出現在已拒絕分頁', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/kb/review')
    await user.click(
      within(screen.getByTestId('kb-request-kb-2')).getByRole('button', { name: '拒絕' }),
    )
    await user.click(screen.getByRole('tab', { name: /已拒絕/ }))
    expect(router.state.location.search).toBe('?tab=rejected')
    expect(screen.getByTestId('kb-request-kb-2')).toBeTruthy()
    expect(screen.getByTestId('kb-request-kb-8')).toBeTruthy()
    expect(screen.getByRole('tab', { name: /已拒絕/ }).getAttribute('aria-selected')).toBe('true')
  })

  it('全部核准只作用於待審，已拒絕不變', async () => {
    const user = userEvent.setup()
    const { store } = renderApp('/kb/review')
    await user.click(within(main()).getByRole('button', { name: '全部核准' }))
    const statuses = store.getState().kb.requests.map((r) => r.status)
    expect(statuses.filter((s) => s === 'pending')).toHaveLength(0)
    expect(statuses.filter((s) => s === 'approved')).toHaveLength(7)
    expect(statuses.filter((s) => s === 'rejected')).toHaveLength(1)
    expect(screen.getByText('沒有待審核的請求')).toBeTruthy()
    expect(within(main()).getByRole('button', { name: '全部核准' }).hasAttribute('disabled')).toBe(
      true,
    )
  })

  it('已核准分頁的卡片沒有操作按鈕，顯示狀態', () => {
    renderApp('/kb/review?tab=approved')
    const card = within(screen.getByTestId('kb-request-kb-3'))
    expect(card.queryByRole('button', { name: '核准寫入' })).toBeNull()
    expect(card.getByText('已核准')).toBeTruthy()
  })

  it('未知的 tab 參數回到待審核', () => {
    renderApp('/kb/review?tab=unknown')
    expect(screen.getByRole('tab', { name: /待審核/ }).getAttribute('aria-selected')).toBe('true')
  })

  it('沒有 KB Writer 的工作空間顯示提示並停用審核', () => {
    const { store } = renderApp('/kb/review')
    act(() => {
      store.dispatch(workspaceSelected('personal'))
    })
    expect(within(main()).getByRole('alert').textContent).toContain('尚未指派 KB Writer')
    expect(within(main()).getByRole('button', { name: '全部核准' }).hasAttribute('disabled')).toBe(
      true,
    )
    expect(within(main()).getByText('沒有待審核的請求')).toBeTruthy()
  })
})
