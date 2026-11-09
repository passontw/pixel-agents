# passon agents 前端

這是 passon agents（原 pixel-agents）的新前端，用來取代 `webview-ui/`。本專案目前是**可運作的骨架**：技術組合、專案結構、與後端的連線方式都已就緒，畫面只有一個範例功能。

## 目前狀態

| 項目                                                                                        | 狀態                                        |
| ------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Vite、React、TypeScript、Redux Toolkit、redux-saga、MUI、react-router                       | 已安裝並運作                                |
| MUI theme（light 與 dark 兩個 colorScheme、角色與狀態語意色、版面 token）                   | 已完成，預設 light                          |
| 設計稿六個畫面（Dashboard、新增 Agent、Agent 詳細頁、Terminal、KB 審核、Style Guide）與 404 | 已實作，資料為 mock                         |
| 後端連線狀態（`features/server`）                                                           | 已完成，顯示在側欄底部                      |
| 開發時代理後端 `/api` 與 `/ws`                                                              | 已設定；`/api` 已驗證，`/ws` 尚未驗證       |
| WebSocket 客戶端與 `core/asyncapi.yaml` 的協定整合                                          | 尚未實作                                    |
| 真實的 Agent、工作空間資料                                                                  | 尚未接後端，目前用 `src/mocks/`             |
| Terminal 接 `/terminal/:agentId` WebSocket 與真實 PTY                                       | 尚未實作，畫面為靜態 mock                   |
| KB 寫入請求的提出、審核與寫入                                                               | 後端第一階段不處理，UI 只是設計稿的前端實作 |
| 登入權杖（token）處理                                                                       | 尚未實作                                    |
| 端對端（e2e）測試                                                                           | 尚未建立                                    |
| 納入根目錄的 npm workspace、CI                                                              | 尚未納入；本專案是獨立的 `package.json`     |

根目錄的 `npm run lint`、`check-types`、`format`、`knip` 都使用明確的目錄清單，不會掃描 `frontend/`，所以本專案不影響既有的 CI。

## 技術組合

| 用途             | 套件                                                                    | 版本（安裝時） |
| ---------------- | ----------------------------------------------------------------------- | -------------- |
| 建置與開發伺服器 | Vite                                                                    | 8.3            |
| UI               | React                                                                   | 19.3           |
| 語言             | TypeScript                                                              | 7.0            |
| 狀態管理         | Redux Toolkit、react-redux                                              | 2.14、9.3      |
| 非同步流程       | redux-saga                                                              | 1.5            |
| 元件庫           | MUI（`@mui/material`、`@mui/icons-material`）加 emotion                 | 9.5            |
| 路由             | react-router                                                            | 7.18           |
| 字型             | `@fontsource/inter`、`@fontsource/jetbrains-mono`（自行打包，不用 CDN） | 5.3            |
| 測試             | vitest、jsdom、Testing Library                                          | 5.1            |
| Lint             | oxlint                                                                  | 1.93           |

文件：[Redux Toolkit](https://redux.js.org/toolkit/)、[redux-saga](https://redux-saga.js.org/)、[MUI](https://mui.com/material-ui/)、[Vite](https://vite.dev/)。

## 快速開始

需要 Node.js 22.12 以上（vitest 5 的要求；Vite 8 本身接受 20.19 以上，但無法跑測試）。本專案使用 npm（整個倉庫只有 `package-lock.json`）。

```bash
# 終端機 1：在倉庫根目錄只啟動後端（不提供舊的網頁）
npm install
npm run build              # 第一次需要，產生 dist/cli.js
npm run start:server -- --port 3100

# 終端機 2：啟動前端
cd frontend
npm install
npm run dev
```

用瀏覽器開 `http://localhost:5173`，按「檢查連線」，卡片會顯示後端的 `status`、`pid`、`uptime`。

注意：請用 `localhost`，不要用 `127.0.0.1`。Vite 預設綁定 `localhost`，在部分機器上會解析成 IPv6（`::1`），用 `127.0.0.1` 會連不上。

### 指令

| 指令              | 說明                                                  |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | 開發伺服器（預設埠 5173，可用 `-- --port 5199` 指定） |
| `npm run build`   | 型別檢查加正式建置，輸出到 `dist/`                    |
| `npm run preview` | 預覽建置結果                                          |
| `npm run lint`    | oxlint                                                |
| `npm test`        | vitest（單次執行）                                    |

### 設定後端位址

開發時 Vite 會把 `/api`、`/ws` 代理到後端，預設是 `http://127.0.0.1:3100`。後端在別的位址時：

```bash
BACKEND_URL=http://127.0.0.1:4000 npm run dev
```

設定在 `vite.config.ts`。這個代理只在 `npm run dev` 有效；正式部署時要由反向代理處理，或讓後端提供前端檔案。

## 目錄結構

```
frontend/
  index.html
  vite.config.ts           開發代理與 vitest 設定（jsdom）
  .prettierrc.json         本專案的 prettier 設定（semi: false，其餘同根目錄）
  src/
    main.tsx               入口：Provider、ThemeProvider（defaultMode）、CssBaseline
    App.tsx                RouterProvider
    app/
      store.ts             configureStore 加 saga middleware；匯出 RootState、AppDispatch
      rootSaga.ts          把各功能的 saga 組合起來
      hooks.ts             型別化的 useAppDispatch、useAppSelector
      routes.tsx           路由表
      paths.ts             路徑、分頁常數
    theme/                 唯一允許出現色碼的目錄
      index.ts             createTheme（cssVariables、colorSchemes）
      palettes.ts          light 與 dark 色票
      types.ts             自訂語意的型別與 module augmentation
      layout.ts            版面 token
      typography.ts        字型與字階
      components.ts        Button、Chip、Tabs、Card、TextField、Switch 等預設外觀
      colorMode.ts         DEFAULT_COLOR_MODE
      fonts.ts             @fontsource 匯入
    layouts/               AppLayout（側欄加 Outlet）、AgentDetailLayout（脈絡列、路由分頁、狀態列）
    pages/                 dashboard、addAgent、agent、terminal、kbReview、styleGuide、NotFoundPage
    components/            RoleBadge、StatusDot、StatusChip、AgentListItem、PageHeader、Sidebar、DiffBlock ...
    features/
      server/              後端連線狀態（範例功能）
      workspaces/          工作空間清單與選取
      agents/              Agent 清單、啟動與停止流程、selectors
      kb/                  KB 寫入請求與審核（後端尚未提供）
    domain/                領域型別與角色資訊
    mocks/                 mock 資料（取自設計稿）
    hooks/ utils/ test/    共用 hook、時間格式化、測試輔助
```

慣例：一個功能一個資料夾，放在 `src/features/<名稱>/`，裡面有 slice、saga、selectors 與測試；頁面放在 `src/pages/`。

## 路由

| 路徑                        | 畫面                                                                  |
| --------------------------- | --------------------------------------------------------------------- |
| `/`                         | Dashboard                                                             |
| `/agents/new`               | 新增 Agent                                                            |
| `/agents/:agentId`          | 預設導向 `log`                                                        |
| `/agents/:agentId/log`      | Session Log                                                           |
| `/agents/:agentId/files`    | Files Changed                                                         |
| `/agents/:agentId/roles`    | Role Activity                                                         |
| `/agents/:agentId/terminal` | Terminal                                                              |
| `/kb/review`                | 知識庫寫入審核（分頁用 `?tab=approved`、`?tab=rejected`，預設待審核） |
| `/style-guide`              | Style Guide                                                           |
| `*`                         | 找不到頁面                                                            |

分頁都由路由決定，沒有本地 state；側欄與分頁列的反白由 NavLink 的 `aria-current` 與 MUI Tabs 的 `value` 決定。

## Theme

- `theme/index.ts` 使用 MUI 的 CSS 變數主題（`cssVariables`）與 `colorSchemes`，同時定義 `light` 與 `dark`。dark 色票取自設計稿 Style Guide；light 是對應語意的淺色版。
- 自訂語意（module augmentation 在 `theme/types.ts`）：`palette.role.{read,edit,delete,kbWrite}`（文字、淡底、邊框）、`palette.status.{running,waiting,idle}`、`palette.border`、`palette.background.{inset,deepest,tag}`、`palette.text.{muted,subtle,ghost}`、`theme.layout`（側欄 240、標題列 48、context 列 40、分頁列 36、狀態列 28、內容內距、圓角 2/3/4/5/6）、字階 `badge`、`code10` 到 `code13`。
- 元件內一律用 `theme.vars.palette...`（CSS 變數）與 `theme.layout`，不寫色碼；`theme/noHardcodedColors.test.ts` 會掃描 `src/` 下 `theme/` 以外的檔案，出現 hex、rgb、hsl 就失敗。
- **切換到 dark**：把 `src/theme/colorMode.ts` 的 `DEFAULT_COLOR_MODE` 改成 `'dark'`。目前沒有切換 UI，也不會讀寫 localStorage（`storageManager={null}`）。

## 資料流

```
元件 dispatch(action)
   -> reducer 先處理（同步，例如 healthRequested 把狀態設為 loading）
   -> saga 攔截同一個 action（takeLatest），執行非同步工作（fetch）
   -> saga 用 put(action) 回報結果（healthSucceeded 或 healthFailed）
   -> reducer 更新狀態 -> 元件重新渲染
```

reducer 負責「狀態怎麼變」，saga 負責「什麼時候、怎麼去拿資料」。saga 不直接改狀態，只發出 action。

## Action、saga 與 mock 資料

| 功能       | Action                                                                                                                                                                                     | Saga                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| workspaces | `workspaceSelected`、`workspaceAdded`                                                                                                                                                      | 無                                                                                                                                         |
| agents     | `agentSelected`、`agentLaunchRequested`、`agentLaunched`、`agentLaunchFailed`、`agentLaunchReset`、`agentStopRequested`、`agentStopped`、`agentPermissionRolesChanged`、`kbWriterAssigned` | `agentLaunchRequested`（takeLatest，延遲後成功；名稱重複或找不到工作空間則失敗）、`agentStopRequested`（takeEvery，延遲後 `agentStopped`） |
| kb         | `kbRequestApproved`、`kbRequestRejected`、`kbRequestsApproveAll`（只作用於 pending）                                                                                                       | 無（reducer 處理）                                                                                                                         |
| server     | `healthRequested`、`healthSucceeded`、`healthFailed`                                                                                                                                       | `serverSaga`                                                                                                                               |

- 每個工作空間只能有一位 KB Writer：`kbWriterAssigned` 與啟動時指定 KB Writer 都會取消同工作空間的舊 Writer。
- selectors 在各功能的 `selectors.ts`（例如 `selectAgentsOfWorkspace`、`selectPendingKbRequests`、`selectAgentById`）。
- mock 資料在 `src/mocks/`：工作空間 weiyun 與 personal；Agent passontw-backend、passontw-spec、passontw-pixel（取自設計稿）加 personal-notes（為對應設計稿「personal：1 agent」而補上）；Session Log 與 Files Changed；KB 請求待審 2、已核准 5、已拒絕 1（已核准與已拒絕的內容為補足數量的最小 mock）；Terminal 範例輸出。
- Role Activity 不另存，由 Session Log 依 Auto Role 分組推導。

## 尚未接後端的項目

- 所有 Agent、工作空間、Session Log 資料來自 mock；啟動與停止只是模擬延遲。
- Terminal 沒有連 `/terminal/:agentId` WebSocket，也沒有真實 PTY。
- KB 寫入請求的提出、審核與寫入，後端第一階段不處理；相關 UI 與 action 只改前端狀態。
- hooks 狀態（`hooks: enabled`）是固定的 mock 值。

## 教學：新增一個功能

下面以「每 5 秒自動輪詢後端狀態」為例，示範一個功能要動哪些地方。這個範例已在暫存複本中驗證過（型別檢查、測試、建置都通過），但**沒有**寫進本專案的原始碼，你可以照著做一次。

### 步驟一：在 slice 加上狀態與 action

`src/features/server/serverSlice.ts`：

```ts
interface ServerState {
  request: ServerRequestState
  health: HealthInfo | null
  error: string | null
  polling: boolean            // 新增
}

const initialState: ServerState = {
  request: 'idle',
  health: null,
  error: null,
  polling: false,             // 新增
}

// 在 reducers 裡新增兩個：
    pollingStarted(state) {
      state.polling = true
    },
    pollingStopped(state) {
      state.polling = false
    },

// 匯出時加上：
export const { healthRequested, healthSucceeded, healthFailed, pollingStarted, pollingStopped } =
  serverSlice.actions
```

Redux Toolkit 的 reducer 裡可以直接寫 `state.polling = true`，它內部用 Immer 轉成不可變更新。這個寫法只能在 `createSlice` 的 reducer 裡用。

### 步驟二：寫 saga

`src/features/server/serverSaga.ts`，先改匯入：

```ts
import { call, delay, put, race, take, takeLatest } from 'redux-saga/effects'
```

再新增：

```ts
export const POLL_INTERVAL_MS = 5000

export function* pollHealth() {
  while (true) {
    yield call(fetchHealth)
    yield delay(POLL_INTERVAL_MS)
  }
}

// 等到 pollingStarted 才開始輪詢，收到 pollingStopped 就取消。
export function* watchPolling() {
  while (true) {
    yield take(pollingStarted.type)
    yield race({
      poll: call(pollHealth),
      stop: take(pollingStopped.type),
    })
  }
}
```

最後在 `serverSaga` 裡啟動它：

```ts
export function* serverSaga() {
  yield takeLatest(healthRequested.type, fetchHealth)
  yield call(watchPolling)
}
```

重點：

- `call(fn)` 呼叫函式並等待結果；`yield` 會讓 saga 暫停，直到結果回來。
- `delay(ms)` 等待一段時間。
- `take(type)` 等待某個 action 出現。
- `race({ a, b })` 同時等多件事，**第一個完成的勝出，其他的自動取消**。這就是「停止輪詢」不需要自己管計時器的原因。

`rootSaga.ts` 不用改，因為 `serverSaga` 已經在裡面。新的功能資料夾則要在 `rootSaga` 的 `all([...])` 加上 `fork(新功能Saga)`，並在 `store.ts` 的 `reducer` 加上新的 slice reducer。

### 步驟三：在元件使用

`src/features/server/ServerStatusCard.tsx`：

```tsx
import { healthRequested, pollingStarted, pollingStopped } from './serverSlice'

const { request, health, error, polling } = useAppSelector((state) => state.server)

// 在 <CardActions> 裡新增：
<Button onClick={() => dispatch(polling ? pollingStopped() : pollingStarted())}>
  {polling ? '停止輪詢' : '開始輪詢'}
</Button>
```

用 `hooks.ts` 匯出的 `useAppSelector`、`useAppDispatch`，不要直接用 react-redux 的 `useSelector`、`useDispatch`，這樣才有型別提示。

### 步驟四：寫測試

`src/features/server/pollHealth.test.ts`。重點是用 redux-saga 官方的 `runSaga` 加 `stdChannel` 手動送入 action，再用 vitest 的假計時器推進時間：

```ts
import { runSaga, stdChannel } from 'redux-saga'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { watchPolling } from './serverSaga'
import { healthSucceeded, pollingStarted, pollingStopped } from './serverSlice'
import type { HealthInfo } from './serverSlice'

describe('watchPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('fetches repeatedly while polling and stops after pollingStopped', async () => {
    const health: HealthInfo = { status: 'ok', uptime: 1, pid: 1 }
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify(health)))
    vi.stubGlobal('fetch', fetchMock)

    const dispatched: unknown[] = []
    const channel = stdChannel()
    const task = runSaga(
      { channel, dispatch: (action: unknown) => dispatched.push(action) },
      watchPolling,
    )

    channel.put(pollingStarted())
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(5000)
    const callsWhilePolling = fetchMock.mock.calls.length
    expect(callsWhilePolling).toBeGreaterThanOrEqual(2)
    expect(dispatched).toContainEqual(healthSucceeded(health))

    channel.put(pollingStopped())
    await vi.advanceTimersByTimeAsync(20000)
    expect(fetchMock.mock.calls.length).toBe(callsWhilePolling)

    task.cancel()
  })
})
```

簡單的 saga（例如 `fetchHealth`）可以直接看 `serverSaga.test.ts`：用 `runSaga` 執行，收集 `dispatch` 的 action，再比對。測試時用 `vi.stubGlobal('fetch', ...)` 取代真正的網路請求。

### 驗證

```bash
npx tsc -b      # 型別檢查
npm test        # 單元測試
npm run lint
npm run build
```

## 教學：使用 MUI

- 元件從 `@mui/material/<元件名>` 個別匯入（例如 `import Button from '@mui/material/Button'`），圖示從 `@mui/icons-material/<圖示名>` 個別匯入。
- 排版優先用 `Stack`、`Box`；間距單位是 4px（`theme.spacing(2)` 是 8px）。
- 顏色、字型、圓角、高度都來自 theme：在 `sx` 用函式寫法，例如 `sx={(theme) => ({ color: theme.vars.palette.text.muted, borderRadius: theme.layout.radius.card })}`；不要寫色碼。
- 外觀優先用語意（`variant`、`color`）：`Button` 有 `contained`、`outlined`（`color="inherit"` 為中性、`color="error"` 為危險）與自訂的 `dashed`；`Chip` 的 `color="error"` 是計數徽章。要新增預設外觀改 `src/theme/components.ts`。
- 新增色票或語意改 `src/theme/palettes.ts` 與 `src/theme/types.ts`，light 與 dark 都要定義（theme 測試會檢查）。

## 與後端連線

後端是 `server/` 的 Node.js 伺服器（Fastify）。可用的入口：

| 入口                          | 用途                                     | 本前端目前是否使用     |
| ----------------------------- | ---------------------------------------- | ---------------------- |
| `GET /api/health`             | 存活檢查，回傳 `status`、`uptime`、`pid` | 是（範例功能）         |
| `GET /ws`                     | 與後端的雙向協定通道                     | 否                     |
| `POST /api/hooks/:providerId` | Claude Code 的 hook 事件進入點           | 否（由 hook 腳本使用） |
| `/terminal/:agentId`          | 網頁終端機的 WebSocket                   | 否                     |

`/ws` 傳遞的訊息格式定義在倉庫根目錄的 `core/asyncapi.yaml`，由它產生 `core/src/messages.ts` 的 TypeScript 型別（ServerMessage、ClientMessage）。舊前端透過 `MessageTransport` 介面（`webview-ui/src/transport/`）收發這些訊息。

整合 WebSocket 時的建議做法（尚未實作）：

1. 用 saga 管理連線：`eventChannel` 包裝 WebSocket 的事件，收到的訊息轉成 Redux action；用 `takeEvery` 把要送出的 action 寫進 socket。
2. 重連採指數退避，參考舊前端 `webSocketTransport.ts`（250 毫秒、500 毫秒、1 秒、2 秒、4 秒為上限）。
3. 型別直接從 `core/src/messages.ts` 匯入，不要重複定義。

特權操作（啟動 Agent、改設定等）需要伺服器權杖。依倉庫根目錄 `CLAUDE.md` 的說明，standalone 伺服器啟動時會在終端機印出含權杖的網址，`/ws` 以 `?token=` 查詢參數帶入；沒有權杖的連線是唯讀。這部分本前端尚未處理，**也尚未驗證**經過 Vite 代理後 `/ws` 的 Origin 與 Host 檢查是否通過，開始整合時請先實測。

## 已知限制與注意事項

- 本專案是獨立專案，沒有加入根目錄的 npm workspace，依賴要在 `frontend/` 內單獨 `npm install`。
- 本專案用 oxlint，沒有套用舊前端的自訂 ESLint 規則；「無寫死色碼」改由測試把關。
- 根目錄的 prettier 設定含分號，本專案以 `frontend/.prettierrc.json`（`semi: false`）維持既有無分號風格。
- 路由使用 `createBrowserRouter`；正式部署需要讓伺服器對所有路徑回傳 `index.html`。
- TypeScript 7.0 是 Vite 範本當時產生的版本，未做過版本評估。
- 設計稿沒有 Files Changed 與 Role Activity 的畫面，這兩個分頁是依其他畫面的語彙自行設計。
