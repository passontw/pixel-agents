import type { Agent } from '../domain/types'
import { minutesAgo, secondsAgo } from './time'

// mock：取自設計稿的三個 Agent；personal 工作空間的 1 個 Agent 是為了對應
// 設計稿「personal：1 agent、無 KB Writer」而補上的最小資料。
export const mockAgents: Agent[] = [
  {
    id: 'passontw-backend',
    name: 'passontw-backend',
    workspaceId: 'weiyun',
    cwd: '~/projects/weiyun-backend',
    status: 'running',
    startedAt: secondsAgo(3 * 60 + 12),
    lastActiveAt: secondsAgo(5),
    branch: 'feat/agent-hooks',
    permissionRoles: ['E'],
    isKbWriter: false,
  },
  {
    id: 'passontw-spec',
    name: 'passontw-spec',
    workspaceId: 'weiyun',
    cwd: '~/projects/weiyun-spec',
    status: 'waiting',
    startedAt: secondsAgo(48),
    lastActiveAt: secondsAgo(10),
    branch: 'main',
    permissionRoles: ['R'],
    isKbWriter: false,
  },
  {
    id: 'passontw-pixel',
    name: 'passontw-pixel',
    workspaceId: 'weiyun',
    cwd: '~/projects/pixel-agents',
    status: 'idle',
    startedAt: minutesAgo(40),
    lastActiveAt: minutesAgo(23),
    branch: 'main',
    permissionRoles: [],
    isKbWriter: true,
  },
  {
    id: 'personal-notes',
    name: 'personal-notes',
    workspaceId: 'personal',
    cwd: '~/personal',
    status: 'idle',
    startedAt: minutesAgo(90),
    lastActiveAt: minutesAgo(60),
    branch: 'main',
    permissionRoles: ['R'],
    isKbWriter: false,
  },
]
