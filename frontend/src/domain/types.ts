// 領域型別。後端第一階段尚未提供對應 API，資料目前來自 mocks/。

export type AgentStatus = 'running' | 'waiting' | 'idle'

/** 權限角色：R 讀取、E 編輯、D 刪除。 */
export type PermissionRole = 'R' | 'E' | 'D'

/** 徽章角色：權限角色加上 W（KB 寫入）。 */
export type RoleCode = PermissionRole | 'W'
