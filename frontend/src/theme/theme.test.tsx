import { ThemeProvider, useTheme } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DEFAULT_COLOR_MODE, theme } from './index'
import type { RoleName, StatusName } from './types'

const ROLES: RoleName[] = ['read', 'edit', 'delete', 'kbWrite']
const STATUSES: StatusName[] = ['running', 'waiting', 'idle']
const SCHEMES = ['light', 'dark'] as const

describe('theme', () => {
  it.each(SCHEMES)('%s scheme 定義了所有角色色（文字、淡底、邊框）', (scheme) => {
    const { role } = theme.colorSchemes[scheme]!.palette
    for (const name of ROLES) {
      expect(role[name].text).toBeTruthy()
      expect(role[name].bg).toBeTruthy()
      expect(role[name].border).toBeTruthy()
    }
  })

  it.each(SCHEMES)('%s scheme 定義了所有狀態色', (scheme) => {
    const { status } = theme.colorSchemes[scheme]!.palette
    for (const name of STATUSES) {
      expect(status[name].main).toBeTruthy()
      expect(status[name].bg).toBeTruthy()
      expect(status[name].glow).toBeTruthy()
    }
  })

  it('light 與 dark 的背景色不同', () => {
    const { light, dark } = theme.colorSchemes
    expect(light!.palette.background.default).not.toBe(dark!.palette.background.default)
  })

  it('dark 色票取自設計稿 Style Guide', () => {
    const { palette } = theme.colorSchemes.dark!
    expect(palette.background.default).toBe('#0c0c10')
    expect(palette.background.paper).toBe('#111117')
    expect(palette.primary.main).toBe('#5b30d6')
    expect(palette.primary.light).toBe('#a78bfa')
    expect(palette.role.edit.text).toBe('#ca8a04')
  })

  it('預設色彩模式為 light', () => {
    expect(DEFAULT_COLOR_MODE).toBe('light')
  })

  it('版面 token 與設計稿一致', () => {
    expect(theme.layout).toMatchObject({
      sidebarWidth: 240,
      headerHeight: 48,
      contextBarHeight: 40,
      tabBarHeight: 36,
      statusBarHeight: 28,
      radius: { badge: 2, button: 3, input: 4, workspace: 5, card: 6 },
    })
  })

  it('字階符合 Style Guide', () => {
    expect(theme.typography.h1.fontSize).toBe('15px')
    expect(theme.typography.badge.fontSize).toBe('9px')
    expect(theme.typography.code12.fontSize).toBe('12px')
  })

  it('元件可透過 theme.vars 取得 CSS 變數', () => {
    function Probe() {
      const t = useTheme()
      return <span data-testid="probe">{t.vars.palette.role.edit.text}</span>
    }
    render(
      <ThemeProvider theme={theme} defaultMode="dark" storageManager={null}>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('probe').textContent).toContain('var(--')
  })
})
