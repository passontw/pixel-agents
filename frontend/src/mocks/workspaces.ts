import type { Workspace } from '../domain/types'

// mock：取自設計稿的工作空間。後端第一階段尚未提供工作空間 API。
export const mockWorkspaces: Workspace[] = [
  { id: 'weiyun', name: 'weiyun', path: '~/weiyun/', kbPath: '~/weiyun/.note/' },
  { id: 'personal', name: 'personal', path: '~/personal/', kbPath: '~/personal/.note/' },
]

export const MOCK_DEFAULT_WORKSPACE_ID = 'weiyun'
