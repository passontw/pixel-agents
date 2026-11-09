import type { PermissionRole } from '../../domain/types'

export const AGENT_NAME_MAX_LENGTH = 40
const AGENT_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/

export interface AddAgentForm {
  name: string
  workspaceId: string
  roles: Record<PermissionRole, boolean>
  isKbWriter: boolean
}

export interface AddAgentErrors {
  name?: string
  workspaceId?: string
  roles?: string
}

export function validateAddAgentForm(form: AddAgentForm, existingNames: string[]): AddAgentErrors {
  const errors: AddAgentErrors = {}
  const name = form.name.trim()
  if (!name) errors.name = '請輸入 Agent 名稱'
  else if (name.length > AGENT_NAME_MAX_LENGTH)
    errors.name = `名稱最長 ${AGENT_NAME_MAX_LENGTH} 個字元`
  else if (!AGENT_NAME_PATTERN.test(name))
    errors.name = '名稱只能使用英數字、- 與 _，且需以英數字開頭'
  else if (existingNames.includes(name)) errors.name = '這個名稱已被使用'

  if (!form.workspaceId) errors.workspaceId = '請選擇工作空間'

  const hasRole = Object.values(form.roles).some(Boolean)
  if (!hasRole && !form.isKbWriter)
    errors.roles = '請至少指派一個 Role（R、E、D），或設為 KB Writer'
  return errors
}

export const hasErrors = (errors: AddAgentErrors) => Object.keys(errors).length > 0
