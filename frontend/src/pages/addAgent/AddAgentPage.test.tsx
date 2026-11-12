import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_LAUNCH_DELAY_MS } from '../../features/agents/agentsSaga'
import { selectKbWriterOfWorkspace } from '../../features/agents/selectors'
import { renderApp } from '../../test/renderApp'

const submitButton = () => screen.getByRole('button', { name: /新增到 .* 工作空間/ })
const main = () => screen.getByRole('main')

describe('新增 Agent 頁', () => {
  it('顯示三個步驟與預設狀態（R 開、E 與 D 關）', () => {
    renderApp('/agents/new')
    const page = within(main())
    expect(page.getByText('1. 選擇工作空間')).toBeTruthy()
    expect(page.getByText('2. 指派 Roles')).toBeTruthy()
    expect(page.getByText('3. 知識庫權限')).toBeTruthy()
    expect((page.getByRole('switch', { name: /^R / }) as HTMLInputElement).checked).toBe(true)
    expect((page.getByRole('switch', { name: /^E / }) as HTMLInputElement).checked).toBe(false)
    expect(page.getByText('目前：passontw-pixel 已是 KB Writer')).toBeTruthy()
  })

  it('選取的工作空間顯示詳情，切換會更新標題與確認按鈕', async () => {
    const user = userEvent.setup()
    renderApp('/agents/new')
    expect(within(main()).getByText('~/weiyun/.note/')).toBeTruthy()
    await user.click(within(main()).getByRole('radio', { name: /personal/ }))
    expect(within(main()).getByText('到 personal 工作空間')).toBeTruthy()
    expect(submitButton().textContent).toBe('新增到 personal 工作空間')
    expect(within(main()).getByText('~/personal/.note/')).toBeTruthy()
  })

  it('驗證：空名稱與沒有任何 Role 時不送出並顯示錯誤', async () => {
    const user = userEvent.setup()
    const { store } = renderApp('/agents/new')
    await user.click(within(main()).getByRole('switch', { name: /^R / }))
    await user.click(submitButton())
    expect(within(main()).getByText('請輸入 Agent 名稱')).toBeTruthy()
    expect(within(main()).getByText(/請至少指派一個 Role/)).toBeTruthy()
    expect(store.getState().agents.launch.status).toBe('idle')
  })

  it('驗證：名稱已被使用', async () => {
    const user = userEvent.setup()
    renderApp('/agents/new')
    await user.type(within(main()).getByRole('textbox', { name: 'Agent 名稱' }), 'passontw-spec')
    await user.click(submitButton())
    expect(within(main()).getByText('這個名稱已被使用')).toBeTruthy()
  })

  it('取代 KB Writer 時顯示警示文字', async () => {
    const user = userEvent.setup()
    renderApp('/agents/new')
    await user.click(within(main()).getByRole('switch', { name: /KB Writer/ }))
    expect(within(main()).getByText(/新增後將由此 Agent 取代/)).toBeTruthy()
  })

  it('新增工作空間對話框', async () => {
    const user = userEvent.setup()
    const { store } = renderApp('/agents/new')
    await user.click(within(main()).getByText('新增工作空間…'))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: '新增' }))
    expect(within(dialog).getByText('請輸入工作空間名稱')).toBeTruthy()
    await user.type(within(dialog).getByRole('textbox', { name: '名稱' }), 'demo')
    await user.type(within(dialog).getByRole('textbox', { name: '路徑' }), '~/demo')
    await user.click(within(dialog).getByRole('button', { name: '新增' }))
    await waitFor(() => expect(store.getState().workspaces.selectedWorkspaceId).toBe('demo'))
  })

  describe('送出流程', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('送出後顯示啟動中，成功後導向新 Agent 頁，並可取代 KB Writer', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { router, store } = renderApp('/agents/new')
      await user.type(within(main()).getByRole('textbox', { name: 'Agent 名稱' }), 'weiyun-new')
      await user.click(within(main()).getByRole('switch', { name: /^E / }))
      await user.click(within(main()).getByRole('switch', { name: /KB Writer/ }))
      await user.click(submitButton())
      expect(screen.getByRole('button', { name: '啟動中…' }).hasAttribute('disabled')).toBe(true)

      await vi.advanceTimersByTimeAsync(MOCK_LAUNCH_DELAY_MS)
      await waitFor(() => expect(router.state.location.pathname).toBe('/agents/weiyun-new/log'))
      const created = store.getState().agents.items.find((a) => a.id === 'weiyun-new')
      expect(created?.permissionRoles).toEqual(['R', 'E'])
      expect(selectKbWriterOfWorkspace(store.getState(), 'weiyun')?.id).toBe('weiyun-new')
    })
  })
})
