import type { Components, Theme } from '@mui/material/styles'

import { CODE_FONT } from './typography'

const alpha30 = 0.3

// 元件預設外觀。頁面只需要語意（variant、color），不必再用 sx 覆寫。
export const components: Components<Omit<Theme, 'components'>> = {
  MuiCssBaseline: {
    styleOverrides: (theme) => ({
      body: { backgroundColor: theme.vars.palette.background.default },
      '*::-webkit-scrollbar': { width: 8, height: 8 },
      '*::-webkit-scrollbar-thumb': {
        backgroundColor: theme.vars.palette.border.strong,
        borderRadius: theme.layout.radius.button,
      },
      code: { fontFamily: CODE_FONT },
    }),
  },
  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: { root: { backgroundImage: 'none' } },
  },
  MuiButton: {
    defaultProps: { disableElevation: true, disableRipple: true, size: 'small' },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.layout.radius.button,
        padding: theme.spacing(1.25, 3.5),
        minWidth: 0,
      }),
      sizeSmall: ({ theme }) => ({ padding: theme.spacing(1, 2.5), ...theme.typography.caption }),
    },
    variants: [
      {
        props: { variant: 'outlined', color: 'inherit' },
        style: ({ theme }) => ({
          borderColor: theme.vars.palette.border.strong,
          color: theme.vars.palette.text.muted,
          '&:hover': {
            borderColor: theme.vars.palette.text.subtle,
            backgroundColor: 'transparent',
          },
        }),
      },
      {
        props: { variant: 'outlined', color: 'error' },
        style: ({ theme }) => ({
          borderColor: theme.alpha(theme.vars.palette.error.main, alpha30),
          '&:hover': { backgroundColor: theme.alpha(theme.vars.palette.error.main, 0.08) },
        }),
      },
      {
        props: { variant: 'contained', color: 'success' },
        style: { fontWeight: 600 },
      },
      {
        props: { variant: 'dashed' },
        style: ({ theme }) => ({
          border: `1px dashed ${theme.vars.palette.border.strong}`,
          color: theme.vars.palette.text.subtle,
          justifyContent: 'flex-start',
          '&:hover': {
            borderColor: theme.vars.palette.text.subtle,
            backgroundColor: 'transparent',
          },
        }),
      },
    ],
  },
  MuiChip: {
    defaultProps: { size: 'small' },
    styleOverrides: {
      root: ({ theme }) => ({
        height: 'auto',
        borderRadius: theme.layout.radius.badge,
        backgroundColor: theme.vars.palette.background.tag,
        border: `1px solid ${theme.vars.palette.border.strong}`,
        color: theme.vars.palette.text.muted,
        ...theme.typography.badge,
      }),
      label: ({ theme }) => ({ padding: theme.spacing(0.25, 1.5) }),
      colorError: ({ theme }) => ({
        backgroundColor: theme.alpha(theme.vars.palette.error.main, 0.15),
        borderColor: 'transparent',
        color: theme.vars.palette.error.main,
      }),
      colorSuccess: ({ theme }) => ({
        backgroundColor: theme.alpha(theme.vars.palette.success.main, 0.08),
        borderColor: theme.alpha(theme.vars.palette.success.main, 0.2),
        color: theme.vars.palette.success.main,
      }),
      colorWarning: ({ theme }) => ({
        backgroundColor: theme.alpha(theme.vars.palette.warning.main, 0.08),
        borderColor: theme.alpha(theme.vars.palette.warning.main, 0.25),
        color: theme.vars.palette.warning.main,
      }),
    },
  },
  MuiCard: {
    defaultProps: { variant: 'outlined' },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.vars.palette.background.paper,
        borderColor: theme.vars.palette.divider,
        borderRadius: theme.layout.radius.card,
        overflow: 'hidden',
      }),
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: theme.spacing(4, 4),
        '&:last-child': { paddingBottom: theme.spacing(4) },
      }),
    },
  },
  MuiTabs: {
    defaultProps: { textColor: 'inherit' },
    styleOverrides: {
      root: ({ theme }) => ({
        minHeight: theme.layout.tabBarHeight,
        height: theme.layout.tabBarHeight,
        borderBottom: `1px solid ${theme.vars.palette.divider}`,
        backgroundColor: theme.vars.palette.background.paper,
      }),
      indicator: ({ theme }) => ({ backgroundColor: theme.vars.palette.primary.main, height: 2 }),
    },
  },
  MuiTab: {
    defaultProps: { disableRipple: true },
    styleOverrides: {
      root: ({ theme }) => ({
        minHeight: theme.layout.tabBarHeight,
        minWidth: 0,
        padding: theme.spacing(0, 3),
        color: theme.vars.palette.text.subtle,
        ...theme.typography.body2,
        '&.Mui-selected': { color: theme.vars.palette.text.primary },
      }),
    },
  },
  MuiTextField: { defaultProps: { size: 'small', variant: 'outlined' } },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.vars.palette.background.inset,
        borderRadius: theme.layout.radius.input,
        ...theme.typography.body2,
        '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.vars.palette.border.strong },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.alpha(theme.vars.palette.primary.main, 0.4),
          borderWidth: 1,
        },
      }),
    },
  },
  MuiSwitch: {
    defaultProps: { disableRipple: true },
    styleOverrides: {
      root: { width: 36, height: 20, padding: 0 },
      switchBase: ({ theme }) => ({
        padding: 3,
        '&.Mui-checked': {
          transform: 'translateX(16px)',
          color: theme.vars.palette.primary.contrastText,
        },
        '&.Mui-checked + .MuiSwitch-track': {
          backgroundColor: theme.vars.palette.primary.main,
          opacity: 1,
        },
      }),
      thumb: { width: 14, height: 14, boxShadow: 'none' },
      track: ({ theme }) => ({
        borderRadius: 10,
        backgroundColor: theme.vars.palette.border.strong,
        opacity: 1,
      }),
    },
  },
  MuiSelect: { defaultProps: { size: 'small' } },
  MuiMenu: {
    styleOverrides: {
      paper: ({ theme }) => ({
        border: `1px solid ${theme.vars.palette.border.strong}`,
        backgroundColor: theme.vars.palette.background.inset,
      }),
    },
  },
  MuiMenuItem: { styleOverrides: { root: ({ theme }) => ({ ...theme.typography.body2 }) } },
  MuiTooltip: {
    styleOverrides: {
      tooltip: ({ theme }) => ({
        backgroundColor: theme.vars.palette.background.deepest,
        color: theme.vars.palette.text.secondary,
        border: `1px solid ${theme.vars.palette.border.strong}`,
        ...theme.typography.caption,
      }),
    },
  },
}
