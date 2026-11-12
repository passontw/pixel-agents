import type { KbRequest } from '../domain/types'
import { minutesAgo } from './time'

// mock：後端第一階段不處理 KB 寫入請求的提出、審核與寫入（後端尚未提供）。
// 待審 2 筆取自設計稿；已核准 5 筆與已拒絕 1 筆的內容為補足數量的最小 mock。
const summary = (
  id: string,
  agentId: string,
  path: string,
  title: string,
  status: KbRequest['status'],
  ago: number,
): KbRequest => ({
  id,
  agentId,
  path,
  kind: 'update',
  title,
  content: [{ kind: 'context', text: '（mock 內容）' }],
  sourceContext: '（mock 來源上下文）',
  createdAt: minutesAgo(ago),
  status,
})

export const mockKbRequests: KbRequest[] = [
  {
    id: 'kb-1',
    agentId: 'passontw-spec',
    path: 'knowledge-base/api-patterns.md',
    kind: 'create',
    title: '新增區段：Workspace-Aware Agent Query',
    content: [
      { kind: 'context', text: '## Workspace-Aware Agent Query' },
      { kind: 'add', text: 'Always filter agent queries by workspaceId to ensure isolation.' },
      { kind: 'add', text: '' },
      { kind: 'add', text: '```typescript' },
      { kind: 'add', text: 'const agents = await db.agents.findAll({ where: { workspaceId } });' },
      { kind: 'add', text: '```' },
    ],
    sourceContext: '在分析 passontw-backend 的 agent.ts 修改時，發現此模式值得記錄。',
    createdAt: minutesAgo(2),
    status: 'pending',
  },
  {
    id: 'kb-2',
    agentId: 'passontw-backend',
    path: 'knowledge-base/hooks-guide.md',
    kind: 'update',
    title: '更新 PreToolUse Hook Timing',
    content: [
      { kind: 'context', text: '## PreToolUse Hook Timing' },
      { kind: 'context', text: 'Hook execution must complete in <50ms.' },
      { kind: 'remove', text: 'Use synchronous checks only.' },
      {
        kind: 'add',
        text: 'Use synchronous checks; async is now supported via Promise.race with 40ms timeout.',
      },
      { kind: 'context', text: 'PostToolUse fires after tool completes.' },
    ],
    sourceContext: '調整 preToolUse hook 時確認非同步檢查可用。',
    createdAt: minutesAgo(8),
    status: 'pending',
  },
  summary('kb-3', 'passontw-spec', 'knowledge-base/glossary.md', '更新詞彙表', 'approved', 30),
  summary('kb-4', 'passontw-backend', 'knowledge-base/routes.md', '更新路由說明', 'approved', 45),
  summary('kb-5', 'passontw-spec', 'knowledge-base/specs.md', '更新規格索引', 'approved', 60),
  summary('kb-6', 'passontw-backend', 'knowledge-base/testing.md', '更新測試慣例', 'approved', 90),
  summary('kb-7', 'passontw-spec', 'knowledge-base/roles.md', '更新角色說明', 'approved', 120),
  summary('kb-8', 'passontw-backend', 'knowledge-base/deploy.md', '更新部署說明', 'rejected', 150),
]
