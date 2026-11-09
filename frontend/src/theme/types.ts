// 自訂語意的型別與 MUI module augmentation。
// 設計稿 Style Guide 的語意：角色色（R/E/D/W）、狀態色、版面 token。

export type RoleName = 'read' | 'edit' | 'delete' | 'kbWrite'
export type StatusName = 'running' | 'waiting' | 'idle'

export interface RoleColor {
  /** 文字色 */
  text: string
  /** 淡底色 */
  bg: string
  /** 邊框色 */
  border: string
}

export interface StatusColor {
  /** 狀態點與強調色 */
  main: string
  /** 狀態文字色 */
  text: string
  /** 狀態標籤底色 */
  bg: string
  /** 狀態標籤邊框色 */
  border: string
  /** running 與 waiting 的發光色 */
  glow: string
}

export interface BorderColors {
  /** 卡片內部分隔線 */
  subtle: string
  /** 輸入框、ghost 按鈕、Switch 關閉狀態 */
  strong: string
}

export interface LayoutTokens {
  sidebarWidth: number
  headerHeight: number
  contextBarHeight: number
  tabBarHeight: number
  statusBarHeight: number
  contentPadding: { compact: number; regular: number }
  /** 圓角（px）：badge 2、button 3、input 4、workspace 5、card 6 */
  radius: { badge: number; button: number; input: number; workspace: number; card: number }
  /** 狀態點直徑 */
  dotSize: { sidebar: number; card: number }
}

declare module '@mui/material/styles' {
  interface CssThemeVariables {
    enabled: true
  }
  interface TypeText {
    muted: string
    subtle: string
    ghost: string
  }
  interface TypeBackground {
    /** 卡片內文、輸入框、次要區塊 */
    inset: string
    /** 狀態列、diff 背景、最深層 */
    deepest: string
    /** 淡標籤底 */
    tag: string
  }
  interface Palette {
    border: BorderColors
    role: Record<RoleName, RoleColor>
    status: Record<StatusName, StatusColor>
  }
  interface PaletteOptions {
    border?: BorderColors
    role?: Record<RoleName, RoleColor>
    status?: Record<StatusName, StatusColor>
  }
  interface Theme {
    layout: LayoutTokens
  }
  interface ThemeOptions {
    layout?: LayoutTokens
  }
  interface TypographyVariants {
    badge: React.CSSProperties
    code10: React.CSSProperties
    code11: React.CSSProperties
    code12: React.CSSProperties
    code13: React.CSSProperties
  }
  interface TypographyVariantsOptions {
    badge?: React.CSSProperties
    code10?: React.CSSProperties
    code11?: React.CSSProperties
    code12?: React.CSSProperties
    code13?: React.CSSProperties
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    badge: true
    code10: true
    code11: true
    code12: true
    code13: true
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    dashed: true
  }
}
