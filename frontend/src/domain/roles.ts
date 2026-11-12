import type { RoleName } from '../theme'
import type { PermissionRole, RoleCode } from './types'

interface RoleInfo {
  code: RoleCode
  themeName: RoleName
  label: string
  englishLabel: string
}

export const ROLE_INFO: Record<RoleCode, RoleInfo> = {
  R: { code: 'R', themeName: 'read', label: '讀取', englishLabel: 'Read' },
  E: { code: 'E', themeName: 'edit', label: '編輯', englishLabel: 'Edit' },
  D: { code: 'D', themeName: 'delete', label: '刪除', englishLabel: 'Delete' },
  W: { code: 'W', themeName: 'kbWrite', label: 'KB寫入', englishLabel: 'KB Writer' },
}

export const ROLE_CODES: RoleCode[] = ['R', 'E', 'D', 'W']
export const PERMISSION_ROLES: PermissionRole[] = ['R', 'E', 'D']

/** 新增 Agent 表單的 R/E/D 說明與涵蓋工具（取自設計稿）。 */
export const PERMISSION_ROLE_DETAILS: Record<
  PermissionRole,
  { description: string; tools: string }
> = {
  R: { description: '讀取檔案、執行 git status 等', tools: 'Bash (read-only), Read, Glob, Grep' },
  E: { description: '寫入與修改工作空間檔案', tools: 'Edit, Write, Bash (write ops)' },
  D: { description: '刪除工作空間檔案', tools: 'Bash (rm), 明確刪除操作' },
}
