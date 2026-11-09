import { describe, expect, it } from 'vitest'

import { formatElapsed, formatRelative } from './time'

describe('formatElapsed', () => {
  it('以分秒顯示', () => {
    expect(formatElapsed(192_000)).toBe('3m 12s')
    expect(formatElapsed(48_000)).toBe('0m 48s')
  })
  it('超過一小時以時分顯示', () => {
    expect(formatElapsed(3_900_000)).toBe('1h 5m')
  })
  it('負值視為 0', () => {
    expect(formatElapsed(-5)).toBe('0m 0s')
  })
})

describe('formatRelative', () => {
  it('不到一分鐘為剛剛', () => {
    expect(formatRelative(30_000)).toBe('剛剛')
  })
  it('分鐘與小時', () => {
    expect(formatRelative(120_000)).toBe('2m 前')
    expect(formatRelative(7_200_000)).toBe('2h 前')
  })
})
