import { describe, expect, it } from 'vitest'

import { hasErrors, validateAddAgentForm } from './validation'
import type { AddAgentForm } from './validation'

const valid: AddAgentForm = {
  name: 'weiyun-new',
  workspaceId: 'weiyun',
  roles: { R: true, E: false, D: false },
  isKbWriter: false,
}

describe('validateAddAgentForm', () => {
  it('合法的表單沒有錯誤', () => {
    expect(hasErrors(validateAddAgentForm(valid, []))).toBe(false)
  })
  it('名稱必填', () => {
    expect(validateAddAgentForm({ ...valid, name: '  ' }, []).name).toBe('請輸入 Agent 名稱')
  })
  it('名稱格式', () => {
    expect(validateAddAgentForm({ ...valid, name: '-bad' }, []).name).toContain('英數字')
    expect(validateAddAgentForm({ ...valid, name: 'a b' }, []).name).toContain('英數字')
  })
  it('名稱不可重複', () => {
    expect(validateAddAgentForm(valid, ['weiyun-new']).name).toBe('這個名稱已被使用')
  })
  it('名稱長度上限', () => {
    expect(validateAddAgentForm({ ...valid, name: 'a'.repeat(41) }, []).name).toContain('最長')
  })
  it('必須選擇工作空間', () => {
    expect(validateAddAgentForm({ ...valid, workspaceId: '' }, []).workspaceId).toBeTruthy()
  })
  it('沒有任何 Role 也不是 KB Writer 時報錯', () => {
    const form = { ...valid, roles: { R: false, E: false, D: false } }
    expect(validateAddAgentForm(form, []).roles).toBeTruthy()
  })
  it('只當 KB Writer 而沒有 R/E/D 是合法的', () => {
    const form = { ...valid, roles: { R: false, E: false, D: false }, isKbWriter: true }
    expect(validateAddAgentForm(form, []).roles).toBeUndefined()
  })
})
