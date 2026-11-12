import { describe, expect, it } from 'vitest'

import type { Agent } from '../domain/types'
import { agentDetailText, agentRoleCodes, currentAutoRole } from './agentText'

const base: Agent = {
  id: 'a',
  name: 'a',
  workspaceId: 'w',
  cwd: '~/a',
  status: 'idle',
  startedAt: 0,
  lastActiveAt: 0,
  branch: 'main',
  permissionRoles: ['R'],
  isKbWriter: false,
}

describe('agentDetailText', () => {
  it('running 帶計時', () => {
    expect(agentDetailText({ ...base, status: 'running', startedAt: 1000 }, 193_000, 0)).toBe(
      'running · 3m 12s',
    )
  })
  it('waiting 與 idle', () => {
    expect(agentDetailText({ ...base, status: 'waiting' }, 0, 0)).toBe('waiting')
    expect(agentDetailText(base, 0, 0)).toBe('idle')
  })
  it('idle 的 KB Writer', () => {
    expect(agentDetailText({ ...base, isKbWriter: true }, 0, 0)).toBe('idle · KB Writer')
    expect(agentDetailText({ ...base, isKbWriter: true }, 0, 2)).toBe('KB Writer · 2 pending')
  })
})

describe('agentRoleCodes', () => {
  it('KB Writer 加上 W', () => {
    expect(agentRoleCodes({ ...base, permissionRoles: ['E'], isKbWriter: true })).toEqual([
      'E',
      'W',
    ])
    expect(agentRoleCodes(base)).toEqual(['R'])
  })
})

describe('currentAutoRole', () => {
  it('取已指派角色中權限最高者', () => {
    expect(currentAutoRole({ ...base, permissionRoles: ['R', 'E'] })).toBe('E')
    expect(currentAutoRole({ ...base, permissionRoles: ['R', 'E', 'D'] })).toBe('D')
    expect(currentAutoRole({ ...base, permissionRoles: ['R'] })).toBe('R')
  })
  it('沒有指派角色時為 undefined', () => {
    expect(currentAutoRole({ ...base, permissionRoles: [] })).toBeUndefined()
  })
})
