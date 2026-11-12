// 領域型別。後端第一階段尚未提供對應 API，資料目前來自 mocks/。

export type AgentStatus = 'running' | 'waiting' | 'idle'

/** 權限角色：R 讀取、E 編輯、D 刪除。 */
export type PermissionRole = 'R' | 'E' | 'D'

/** 徽章角色：權限角色加上 W（KB 寫入）。 */
export type RoleCode = PermissionRole | 'W'

export interface Workspace {
  id: string
  name: string
  /** 工作空間根目錄，例如 ~/weiyun/ */
  path: string
  /** 知識庫目錄，例如 ~/weiyun/.note/ */
  kbPath: string
}

export interface Agent {
  id: string
  name: string
  workspaceId: string
  cwd: string
  status: AgentStatus
  /** 開始時間（epoch 毫秒） */
  startedAt: number
  /** 最後活動時間（epoch 毫秒），idle 卡片顯示 */
  lastActiveAt: number
  branch: string
  permissionRoles: PermissionRole[]
  isKbWriter: boolean
}

export type SessionToolStatus = 'done' | 'running'

/** diff 的一行：add 為新增、remove 為刪除、context 為前後文、hunk 為 @@ 標頭。 */
export interface DiffLine {
  kind: 'add' | 'remove' | 'context' | 'hunk'
  text: string
}

export interface SessionEntry {
  id: string
  /** 工具名稱：Bash、Read、Edit ... */
  tool: string
  /** 工具參數：指令或檔案路徑 */
  argument: string
  /** Auto Role 自動套用的角色 */
  autoRole: PermissionRole
  /** 角色是否因此次呼叫而自動提升（Auto: Edit ⬆） */
  roleSwitched?: boolean
  status: SessionToolStatus
  /** 補充說明，例如「245 lines」「+12 / -3」 */
  meta?: string
  /** 指令輸出 */
  output?: string[]
  diff?: DiffLine[]
}

export interface FileChange {
  path: string
  added: number
  removed: number
}

export interface AgentDetails {
  sessionLog: SessionEntry[]
  filesChanged: FileChange[]
}

export type KbRequestKind = 'create' | 'update'
export type KbRequestStatus = 'pending' | 'approved' | 'rejected'

/** KB 寫入請求。後端尚未提供提出、審核與寫入，目前僅為前端畫面與 mock。 */
export interface KbRequest {
  id: string
  agentId: string
  path: string
  kind: KbRequestKind
  title: string
  /** 提案內容或更新差異 */
  content: DiffLine[]
  /** 來源上下文 */
  sourceContext: string
  /** 提出時間（epoch 毫秒） */
  createdAt: number
  status: KbRequestStatus
}
