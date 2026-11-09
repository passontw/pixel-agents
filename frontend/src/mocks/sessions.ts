import type { AgentDetails } from '../domain/types'

// mock：passontw-backend 的 Session Log（取自設計稿 Claude Code 畫面）。
const backendDetails: AgentDetails = {
  sessionLog: [
    {
      id: 'backend-1',
      tool: 'Bash',
      argument: 'git status && git diff --stat',
      autoRole: 'R',
      status: 'done',
      output: [
        'On branch feat/agent-hooks',
        'modified:   src/routes/agent.ts',
        'modified:   src/hooks/preToolUse.ts',
      ],
    },
    {
      id: 'backend-2',
      tool: 'Read',
      argument: 'src/routes/agent.ts',
      autoRole: 'R',
      status: 'done',
      meta: '245 lines',
    },
    {
      id: 'backend-3',
      tool: 'Edit',
      argument: 'src/routes/agent.ts',
      autoRole: 'E',
      roleSwitched: true,
      status: 'done',
      meta: '+12 / -3',
      diff: [
        { kind: 'hunk', text: "@@ -42,7 +42,19 @@ router.get('/agents', async (req, res) => {" },
        { kind: 'remove', text: 'const agents = await db.agents.findAll();' },
        { kind: 'add', text: 'const agents = await db.agents.findAll({' },
        { kind: 'add', text: '  where: { workspaceId: req.workspace.id }' },
        { kind: 'add', text: '});' },
      ],
    },
    {
      id: 'backend-4',
      tool: 'Bash',
      argument: 'npm run typecheck',
      autoRole: 'R',
      status: 'running',
    },
  ],
  // 設計稿 Files Changed 標示 3 個；agent.ts 的 +12 / -3 取自設計稿，
  // 其餘檔案與數字為 mock。
  filesChanged: [
    { path: 'src/routes/agent.ts', added: 12, removed: 3 },
    { path: 'src/hooks/preToolUse.ts', added: 28, removed: 9 },
    { path: 'src/hooks/postToolUse.ts', added: 15, removed: 0 },
  ],
}

const specDetails: AgentDetails = {
  sessionLog: [{ id: 'spec-1', tool: 'Read', argument: 'SPEC.md', autoRole: 'R', status: 'done' }],
  filesChanged: [],
}

export const mockAgentDetails: Record<string, AgentDetails> = {
  'passontw-backend': backendDetails,
  'passontw-spec': specDetails,
}

export const EMPTY_AGENT_DETAILS: AgentDetails = { sessionLog: [], filesChanged: [] }
