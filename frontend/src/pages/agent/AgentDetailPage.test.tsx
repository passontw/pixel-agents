import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderApp } from '../../test/renderApp'

const main = () => screen.getByRole('main')

describe('Agent 詳細頁', () => {
  it('脈絡列顯示名稱、路徑與 Auto Role', () => {
    renderApp('/agents/passontw-backend/log')
    const page = within(main())
    expect(page.getByRole('heading', { level: 1, name: 'passontw-backend' })).toBeTruthy()
    expect(page.getByText('~/projects/weiyun-backend')).toBeTruthy()
    expect(page.getByText('Auto: Edit role')).toBeTruthy()
  })

  it('Session Log 列出工具呼叫、Auto 標記、輸出與 diff', () => {
    renderApp('/agents/passontw-backend/log')
    const page = within(main())
    expect(page.getByText('git status && git diff --stat')).toBeTruthy()
    expect(page.getByText('On branch feat/agent-hooks')).toBeTruthy()
    expect(page.getByText('245 lines')).toBeTruthy()
    const edit = within(screen.getByTestId('tool-call-backend-3'))
    expect(edit.getByText('Auto: Edit')).toBeTruthy()
    expect(edit.getByLabelText('角色自動提升')).toBeTruthy()
    expect(edit.getByLabelText('diff').querySelectorAll('[data-diff="add"]')).toHaveLength(3)
    expect(edit.getByLabelText('diff').querySelectorAll('[data-diff="remove"]')).toHaveLength(1)
    expect(within(screen.getByTestId('tool-call-backend-4')).getByText('running')).toBeTruthy()
  })

  it('KB 寫入請求橫幅連到 /kb/review', () => {
    renderApp('/agents/passontw-backend/log')
    const page = within(main())
    expect(page.getByText('KB 寫入請求已提交')).toBeTruthy()
    expect(page.getByText('待 passontw-pixel (W) 審核')).toBeTruthy()
    expect(page.getByRole('link', { name: '查看請求' }).getAttribute('href')).toBe('/kb/review')
  })

  it('底部狀態列顯示工具呼叫數、branch、hooks、Auto Role 與待審數', () => {
    renderApp('/agents/passontw-backend/log')
    const footer = within(screen.getByRole('contentinfo'))
    expect(footer.getByText('4 tool calls')).toBeTruthy()
    expect(footer.getByText('feat/agent-hooks')).toBeTruthy()
    expect(footer.getByText('hooks: enabled')).toBeTruthy()
    expect(footer.getByText('1 KB request pending')).toBeTruthy()
    expect(footer.getByText('Auto Role: Edit')).toBeTruthy()
  })

  it('Files Changed 分頁顯示數量與檔案清單', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/agents/passontw-backend/log')
    const tab = screen.getByRole('tab', { name: /Files Changed/ })
    expect(within(tab).getByText('3')).toBeTruthy()
    await user.click(tab)
    expect(router.state.location.pathname).toBe('/agents/passontw-backend/files')
    expect(within(main()).getByText('src/routes/agent.ts')).toBeTruthy()
    expect(within(main()).getByText('3 個檔案 · +55 / -12')).toBeTruthy()
  })

  it('Role Activity 依角色分組，Switch 變更觸發 agentPermissionRolesChanged', async () => {
    const user = userEvent.setup()
    const { store } = renderApp('/agents/passontw-backend/roles')
    expect(within(screen.getByTestId('role-group-R')).getByText('3 次')).toBeTruthy()
    expect(within(screen.getByTestId('role-group-E')).getByText('1 次')).toBeTruthy()
    await user.click(within(main()).getByRole('switch', { name: /^D / }))
    const agent = store.getState().agents.items.find((a) => a.id === 'passontw-backend')
    expect(agent?.permissionRoles).toEqual(['E', 'D'])
  })

  it('Stop 觸發 agentStopRequested', async () => {
    const user = userEvent.setup()
    const { store } = renderApp('/agents/passontw-backend/log')
    await user.click(within(main()).getByRole('button', { name: 'Stop' }))
    expect(store.getState().agents.stoppingIds).toEqual(['passontw-backend'])
    expect(within(main()).getByRole('button', { name: 'Stopping…' }).hasAttribute('disabled')).toBe(
      true,
    )
  })

  it('idle 的 Agent 不能 Stop；Terminal 連結導向 terminal', () => {
    renderApp('/agents/passontw-pixel/log')
    const page = within(main())
    expect(page.getByRole('button', { name: 'Stop' }).hasAttribute('disabled')).toBe(true)
    expect(page.getByRole('link', { name: 'Terminal' }).getAttribute('href')).toBe(
      '/agents/passontw-pixel/terminal',
    )
    expect(page.getByText('尚無工具呼叫紀錄')).toBeTruthy()
  })

  it('不存在的 Agent 顯示找不到', () => {
    renderApp('/agents/nope/log')
    expect(screen.getByRole('heading', { name: '找不到這個 Agent' })).toBeTruthy()
  })

  it('進入頁面會同步 selectedAgentId', () => {
    const { store } = renderApp('/agents/passontw-spec/log')
    expect(store.getState().agents.selectedAgentId).toBe('passontw-spec')
  })
})
