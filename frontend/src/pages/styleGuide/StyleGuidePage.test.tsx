import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { theme } from '../../theme'
import { renderApp } from '../../test/renderApp'

describe('Style Guide 頁', () => {
  it('色票顯示 theme 目前 scheme 的實際色值', () => {
    renderApp('/style-guide')
    const page = within(screen.getByRole('main'))
    expect(page.getByText('目前色彩模式：light')).toBeTruthy()
    expect(page.getByText(theme.colorSchemes.light!.palette.background.default)).toBeTruthy()
    expect(page.getByText(theme.colorSchemes.light!.palette.primary.main)).toBeTruthy()
    expect(page.getAllByTestId('swatch').length).toBeGreaterThan(15)
  })

  it('展示角色徽章、狀態點、按鈕與版面 token', () => {
    renderApp('/style-guide')
    const page = within(screen.getByRole('main'))
    expect(page.getByText('W KB寫入')).toBeTruthy()
    expect(page.getByText('Running · glow')).toBeTruthy()
    expect(page.getByRole('button', { name: '核准' })).toBeTruthy()
    expect(page.getByText(/sidebar width: 240px/)).toBeTruthy()
    expect(page.getByText('h1 · 15px')).toBeTruthy()
  })
})
