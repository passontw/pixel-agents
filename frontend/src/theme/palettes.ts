// 色票只允許出現在 theme/ 目錄。dark 取自設計稿 Style Guide；light 為對應的淺色版。
import type { PaletteOptions } from '@mui/material/styles'

export const darkPalette: PaletteOptions = {
  primary: { main: '#5b30d6', light: '#a78bfa', contrastText: '#ffffff' },
  success: { main: '#22c55e', contrastText: '#0a0a0f' },
  warning: { main: '#f59e0b', contrastText: '#0a0a0f' },
  error: { main: '#ef4444', contrastText: '#ffffff' },
  info: { main: '#60a5fa', contrastText: '#0a0a0f' },
  background: {
    default: '#0c0c10',
    paper: '#111117',
    inset: '#0e0e14',
    deepest: '#0a0a0f',
    tag: '#18181f',
  },
  divider: '#1e1e2a',
  border: { subtle: '#1a1a24', strong: '#2a2a38' },
  text: {
    primary: '#f1f5f9',
    secondary: '#9ca3af',
    muted: '#6b7280',
    subtle: '#4b5563',
    ghost: '#374151',
    disabled: '#374151',
  },
  action: {
    selected: 'rgba(91, 48, 214, 0.1)',
    hover: 'rgba(241, 245, 249, 0.04)',
    focus: 'rgba(91, 48, 214, 0.4)',
  },
  role: {
    read: { text: '#60a5fa', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' },
    edit: { text: '#ca8a04', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.25)' },
    delete: { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
    kbWrite: { text: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)' },
  },
  status: {
    running: {
      main: '#22c55e',
      text: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.08)',
      border: 'rgba(34, 197, 94, 0.15)',
      glow: 'rgba(34, 197, 94, 0.5)',
    },
    waiting: {
      main: '#f59e0b',
      text: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.15)',
      glow: 'rgba(245, 158, 11, 0.4)',
    },
    idle: {
      main: '#374151',
      text: '#4b5563',
      bg: '#18181f',
      border: '#2a2a38',
      glow: 'transparent',
    },
  },
}

export const lightPalette: PaletteOptions = {
  primary: { main: '#5b30d6', light: '#7c58e8', contrastText: '#ffffff' },
  success: { main: '#16a34a', contrastText: '#ffffff' },
  warning: { main: '#d97706', contrastText: '#ffffff' },
  error: { main: '#dc2626', contrastText: '#ffffff' },
  info: { main: '#2563eb', contrastText: '#ffffff' },
  background: {
    default: '#f5f5f8',
    paper: '#ffffff',
    inset: '#f1f1f6',
    deepest: '#e9e9f0',
    tag: '#ececf3',
  },
  divider: '#e2e2ea',
  border: { subtle: '#ebebf1', strong: '#cdcdda' },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#64748b',
    subtle: '#7b8798',
    ghost: '#94a3b8',
    disabled: '#94a3b8',
  },
  action: {
    selected: 'rgba(91, 48, 214, 0.08)',
    hover: 'rgba(15, 23, 42, 0.04)',
    focus: 'rgba(91, 48, 214, 0.4)',
  },
  role: {
    read: { text: '#1d4ed8', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(37, 99, 235, 0.25)' },
    edit: { text: '#a16207', bg: 'rgba(202, 138, 4, 0.1)', border: 'rgba(202, 138, 4, 0.3)' },
    delete: { text: '#b91c1c', bg: 'rgba(220, 38, 38, 0.08)', border: 'rgba(220, 38, 38, 0.25)' },
    kbWrite: { text: '#15803d', bg: 'rgba(22, 163, 74, 0.08)', border: 'rgba(22, 163, 74, 0.25)' },
  },
  status: {
    running: {
      main: '#16a34a',
      text: '#15803d',
      bg: 'rgba(22, 163, 74, 0.08)',
      border: 'rgba(22, 163, 74, 0.25)',
      glow: 'rgba(22, 163, 74, 0.45)',
    },
    waiting: {
      main: '#d97706',
      text: '#b45309',
      bg: 'rgba(217, 119, 6, 0.08)',
      border: 'rgba(217, 119, 6, 0.28)',
      glow: 'rgba(217, 119, 6, 0.4)',
    },
    idle: {
      main: '#94a3b8',
      text: '#64748b',
      bg: '#ececf3',
      border: '#cdcdda',
      glow: 'transparent',
    },
  },
}
