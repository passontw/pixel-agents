import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderApp } from '../../test/renderApp'

const main = () => screen.getByRole('main')

describe('Terminal 頁', () => {
  it('顯示脈絡列、mock 輸出與底部狀態列，並標明尚未接 WebSocket', () => {
    renderApp('/agents/passontw-backend/terminal')
    const page = within(main())
    expect(page.getByRole('heading', { level: 1, name: 'passontw-backend' })).toBeTruthy()
    expect(page.getByText(/尚未連接 \/terminal WebSocket/)).toBeTruthy()
    expect(page.getByText('hooks 重構')).toBeTruthy()
    expect(page.getByText('"hooks 重構 & KB 攔截審查"')).toBeTruthy()
    expect(page.getByText('src/hooks/preToolUse.ts')).toBeTruthy()
    const footer = within(screen.getByRole('contentinfo'))
    expect(footer.getByText('auto mode on (shift+tab to cycle)')).toBeTruthy()
    expect(footer.getByText('← 3 agents')).toBeTruthy()
    expect(footer.getByText('Auto Role: Edit')).toBeTruthy()
  })

  it('Session Log 按鈕導回 Agent 詳細頁', () => {
    renderApp('/agents/passontw-backend/terminal')
    expect(within(main()).getByRole('link', { name: 'Session Log' }).getAttribute('href')).toBe(
      '/agents/passontw-backend/log',
    )
  })

  it('沒有範例輸出的 Agent 仍可顯示（只有提示與輸入列）', () => {
    renderApp('/agents/passontw-spec/terminal')
    expect(within(main()).getByLabelText('terminal 輸出')).toBeTruthy()
  })

  it('不存在的 Agent 顯示找不到', () => {
    renderApp('/agents/nope/terminal')
    expect(screen.getByRole('heading', { name: '找不到這個 Agent' })).toBeTruthy()
  })
})
