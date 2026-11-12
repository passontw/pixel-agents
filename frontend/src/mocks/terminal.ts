// mock：Terminal 的範例輸出（取自設計稿 Terminal 畫面）。
// 尚未接 /terminal WebSocket 與真實 PTY；此處只是靜態呈現。
export type TerminalPart = string | { code: string }

export type TerminalLine =
  | { kind: 'blank' }
  | { kind: 'field'; label: string; value: string }
  | { kind: 'heading'; text: string }
  | { kind: 'item'; marker: string; parts: TerminalPart[] }
  | { kind: 'finished'; title: string; duration: string }
  | { kind: 'recap'; text: string }

const field = (label: string, value: string): TerminalLine => ({ kind: 'field', label, value })
const blank: TerminalLine = { kind: 'blank' }

const backendOutput: TerminalLine[] = [
  field('階段：', 'hooks 重構'),
  field('內容：', 'preToolUse / postToolUse 拆分為獨立模組，新增 role 驗證層'),
  field('說明：', '依 R/E/D 自動攔截；Write/Edit 需 E role，rm 需 D role，否則回傳 403'),
  blank,
  field('階段：', 'KB 寫入攔截'),
  field('內容：', '偵測 .note/ 下的 Write/Edit 操作，非 KB Writer 自動轉為寫入請求'),
  field('說明：', '請求寫入 pending queue，由 passontw-pixel 審核；Read 不受限'),
  blank,
  field('階段：', '同一批'),
  field('內容：', 'S1 role 中間件；S2 KB 路徑偵測；S2b pending queue API；S2c 審核通知'),
  field('說明：', '單一 executor 依序處理'),
  blank,
  { kind: 'heading', text: '請你確認' },
  {
    kind: 'item',
    marker: '1. ',
    parts: ['preToolUse hook 目前在 ', { code: 'src/hooks/preToolUse.ts' }, '，確認路徑正確。'],
  },
  {
    kind: 'item',
    marker: '2. ',
    parts: [
      '每個工作空間的 KB Writer 存在 workspace config，讀取 ',
      { code: 'workspace.kbWriterId' },
      '。',
    ],
  },
  {
    kind: 'item',
    marker: '3. ',
    parts: ['上線前確認 .note/ 路徑符合 ', { code: '{workspaceRoot}/.note/' }, ' 規則。'],
  },
  blank,
  { kind: 'heading', text: '不在範圍' },
  { kind: 'item', marker: '– ', parts: ['跨工作空間 KB 讀取。'] },
  { kind: 'item', marker: '– ', parts: ['KB Writer 自動輪替機制。'] },
  { kind: 'item', marker: '– ', parts: ['審核逾時自動拒絕。'] },
  { kind: 'finished', title: 'hooks 重構 & KB 攔截審查', duration: '3m 47s' },
  {
    kind: 'recap',
    text: '目標是在 preToolUse hook 加入 R/E/D role 驗證，並在 Write/Edit 偵測到 .note/ 路徑時自動轉為 KB 寫入請求。尚未修改任何程式碼；下一步是等你回覆「核准」。',
  },
]

export const mockTerminalOutputs: Record<string, TerminalLine[]> = {
  'passontw-backend': backendOutput,
}

/** 其他 Agent 沒有範例輸出時的內容。 */
export const EMPTY_TERMINAL_OUTPUT: TerminalLine[] = []
