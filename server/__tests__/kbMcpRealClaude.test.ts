import { execFile, execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { DEFAULT_WORKSPACE_ID } from '../../core/src/constants.js';
import { KB_MCP_CONFIG_FLAG } from '../src/constants.js';
import { createHttpServer, type HttpServerHandle } from '../src/httpServer.js';
import { KbPaths } from '../src/kbFiles.js';
import { KbMcpEndpoint } from '../src/kbMcp.js';
import { KbRuntime } from '../src/kbRuntime.js';
import type { KbStore } from '../src/kbStore.js';
import { claudeProvider } from '../src/providers/hook/claude/claude.js';
import { launchStandaloneAgent } from '../src/terminal/standaloneAgentLauncher.js';
import { capabilityTokenOf, KbHarness } from './curatorHarness.js';
import { approve, proposer, singleStore, submitCreate } from './kbHarness.js';

/**
 * S3b acceptance 12: the real `claude` CLI against the hand-written /mcp.
 *
 * SKIPPED unless PIXEL_AGENTS_REAL_CLAUDE is set: `npm test`, `npm run
 * test:server` and CI never set it, so they start no claude process. Run on
 * purpose, once, with:
 *
 *   PIXEL_AGENTS_REAL_CLAUDE=1 npx vitest run --root server kbMcpRealClaude
 *
 * Budget: exactly three `claude -p --model haiku` runs (subscription), never
 * retried; a failure is reported, not re-run. Before them, `claude --version`
 * (must be 2.1.285, the S3-0 baseline) and `claude auth status` (must be a
 * claude.ai login) are read, and ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN must
 * be absent; otherwise every case is skipped with the reason logged.
 *
 * The server is real (HTTP on 127.0.0.1, CapabilityRegistry, KbStore on a
 * temporary KB root); the agent's argv and env are the launcher's own (a fake
 * PTY records them; claude itself runs through execFile with the prompt before
 * the flags). claude keeps the real HOME so its login works, runs in a
 * temporary cwd with `--setting-sources project` so no user hooks (an
 * installed Pixel Agents hook included) fire, and sees a dead HTTP_PROXY with
 * the launcher's NO_PROXY.
 */

const ENABLED = Boolean(process.env.PIXEL_AGENTS_REAL_CLAUDE);
const EXPECTED_CLAUDE_VERSION = '2.1.285';
const CLAUDE_TIMEOUT_MS = 150_000;
const DEAD_PROXY = 'http://127.0.0.1:9';
const MARKER = 'PIXEL-KB-MARKER-7f3a';

interface ClaudeRun {
  code: number | null;
  stdout: string;
  stderr: string;
  ms: number;
}

describe.skipIf(!ENABLED)('real claude against /mcp (acceptance 12)', () => {
  const realHome = os.homedir();
  let skipReason: string | null = null;
  let h: KbHarness;
  let server: HttpServerHandle;
  let store: KbStore;
  let kb: KbRuntime;
  let entryId: string;
  let cwd: string;
  let claudeRuns = 0;
  const seen: string[] = [];
  const mcpLog: string[] = [];

  function preflight(): string | null {
    if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) {
      return 'ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN is set (subscription only)';
    }
    let version: string;
    let auth: string;
    try {
      version = execFileSync('claude', ['--version'], { encoding: 'utf-8', timeout: 30_000 });
      auth = execFileSync('claude', ['auth', 'status'], { encoding: 'utf-8', timeout: 30_000 });
    } catch (err) {
      return `claude preflight failed: ${err instanceof Error ? err.message : String(err)}`;
    }
    if (!version.includes(EXPECTED_CLAUDE_VERSION)) {
      return `claude --version is "${version.trim()}", not ${EXPECTED_CLAUDE_VERSION} (stop condition 2)`;
    }
    if (!/claude\.ai/i.test(auth)) return 'claude auth status does not report a claude.ai login';
    return null;
  }

  /** A launch the production way; returns the claude argv/env it would spawn. */
  function launchAgent(): {
    id: number;
    args: string[];
    env: Record<string, string>;
    token: string;
  } {
    const before = h.spawned.length;
    const id = launchStandaloneAgent({
      store: h.store,
      runtime: h.runtime,
      ptyManager: h.manager,
      provider: { ...claudeProvider, getSessionDirs: () => [h.projectDir] },
      capabilities: h.capabilities,
      isKbEnabled: kb.isKbEnabled,
      kb,
    });
    expect(h.spawned.length).toBe(before + 1);
    const spawn = h.spawned[h.spawned.length - 1];
    expect(spawn.args).toContain(KB_MCP_CONFIG_FLAG);
    return {
      id: id!,
      args: spawn.args,
      env: spawn.options.env!,
      token: capabilityTokenOf(spawn.options.env)!,
    };
  }

  /** One `claude -p` run. Never retried. */
  function runClaude(prompt: string, agent: { args: string[]; env: Record<string, string> }) {
    claudeRuns++;
    expect(claudeRuns).toBeLessThanOrEqual(3);
    const argv = [
      '-p',
      prompt,
      '--model',
      'haiku',
      '--setting-sources',
      'project',
      ...agent.args, // --session-id <uuid> ... --mcp-config <json> --allowedTools <4 names>
    ];
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) env[key] = value;
    }
    Object.assign(env, agent.env, {
      HOME: realHome,
      HTTP_PROXY: DEAD_PROXY,
      HTTPS_PROXY: DEAD_PROXY,
      http_proxy: DEAD_PROXY,
      https_proxy: DEAD_PROXY,
    });
    const started = Date.now();
    return new Promise<ClaudeRun>((resolve) => {
      execFile(
        'claude',
        argv,
        { cwd, env, timeout: CLAUDE_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024 },
        (error, stdout, stderr) => {
          const code = error && typeof error.code === 'number' ? error.code : error ? null : 0;
          resolve({ code, stdout, stderr, ms: Date.now() - started });
        },
      );
    });
  }

  beforeAll(async () => {
    skipReason = preflight();
    if (skipReason) {
      console.warn(`[kbMcpRealClaude] skipped: ${skipReason}`);
      return;
    }
    h = new KbHarness(); // temp HOME for the server side; claude gets realHome
    vi.spyOn(console, 'log').mockImplementation(() => {});
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'pxl-real-claude-'));
    const paths = new KbPaths(path.join(h.tempHome, '.pixel-agents', 'kb'));
    store = singleStore(paths);
    kb = new KbRuntime({ bindHost: '127.0.0.1', paths, store });
    expect((await store.writeSettings(DEFAULT_WORKSPACE_ID, { kbEnabled: true })).ok).toBe(true);
    const created = await submitCreate(
      store,
      'Project conventions',
      `The secret marker is ${MARKER}.`,
      proposer(900),
    );
    expect((await approve(store, created)).ok).toBe(true);
    const listed = await store.listEntries(DEFAULT_WORKSPACE_ID);
    if (!listed.ok) throw new Error('list failed');
    entryId = listed.entries[0].id;
    server = await createHttpServer({
      embedded: false,
      host: '127.0.0.1',
      port: 0,
      token: 'not-a-capability',
      store: h.store,
      runtime: h.runtime,
      ptyManager: h.manager,
      capabilities: h.capabilities,
      curators: h.curators,
      kb,
      isKbEnabled: kb.isKbEnabled,
      mcpEndpoint: new KbMcpEndpoint({
        capabilities: h.capabilities,
        store,
        instance: kb.instance,
        log: (line) => mcpLog.push(line),
      }),
    });
    server.app.server.on('request', (req: { method?: string; url?: string }) => {
      seen.push(`${req.method} ${(req.url ?? '').split('?')[0]}`);
    });
    kb.serverListening(server.port);
  });

  afterAll(async () => {
    if (skipReason) return;
    console.warn(
      `[kbMcpRealClaude] claude runs: ${claudeRuns}; requests seen: ${JSON.stringify(seen)}`,
    );
    console.warn(`[kbMcpRealClaude] /mcp log: ${JSON.stringify(mcpLog)}`);
    await server?.app.close();
    h?.dispose();
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  it(
    '1: kb_list then kb_read in one run returns the entry',
    async (ctx) => {
      if (skipReason) ctx.skip();
      const agent = launchAgent();
      const run = await runClaude(
        `Call the kb_list tool, then call kb_read with the id of the entry it lists, and reply with the exact secret marker the entry contains.`,
        agent,
      );
      console.warn(
        `[kbMcpRealClaude] run 1: code ${run.code}, ${run.ms} ms, stderr ${run.stderr.slice(0, 400)}`,
      );
      expect(run.stdout).toContain(MARKER);
      expect(mcpLog.some((line) => line.includes('initialize -> 200'))).toBe(true);
      expect(mcpLog.some((line) => line.includes('tools/list -> 200'))).toBe(true);
      expect(entryId).toMatch(/^[0-9a-f-]{36}$/);
    },
    CLAUDE_TIMEOUT_MS + 30_000,
  );

  it(
    "2: kb_propose leaves a pending proposal with the capability's proposer",
    async (ctx) => {
      if (skipReason) ctx.skip();
      const agent = launchAgent();
      const claims = h.capabilities.verify(agent.token)!;
      const run = await runClaude(
        `Call the kb_propose tool with kind "create", title "Haiku note" and content "Proposed by the real claude test." Then reply with the proposalId it returns.`,
        agent,
      );
      console.warn(
        `[kbMcpRealClaude] run 2: code ${run.code}, ${run.ms} ms, stderr ${run.stderr.slice(0, 400)}`,
      );
      const listed = await store.listProposals(DEFAULT_WORKSPACE_ID, { state: 'pending' });
      if (!listed.ok) throw new Error('list failed');
      const mine = listed.proposals.filter((p) => p.proposer.agentId === claims.agentId);
      expect(mine).toHaveLength(1);
      expect(mine[0].proposer).toEqual({
        instance: kb.instance,
        agentId: claims.agentId,
        sessionId: claims.sessionId,
        serial: claims.serial,
      });
      expect(run.stdout).toContain(mine[0].id);
    },
    CLAUDE_TIMEOUT_MS + 30_000,
  );

  it(
    '3: a revoked capability: record what claude does',
    async (ctx) => {
      if (skipReason) ctx.skip();
      const agent = launchAgent();
      h.capabilities.revokeAgent(agent.id);
      expect(h.capabilities.verify(agent.token)).toBeNull();
      const before = seen.length;
      const handledBefore = mcpLog.length;
      const run = await runClaude(
        `Call the kb_list tool and report exactly what happened, including any error text.`,
        agent,
      );
      const requests = seen.slice(before);
      console.warn(
        `[kbMcpRealClaude] run 3 (revoked): code ${run.code}, ${run.ms} ms, requests ${JSON.stringify(requests)}, stdout ${run.stdout.slice(0, 600)}, stderr ${run.stderr.slice(0, 400)}`,
      );
      // Finished on its own within the timeout (did not hang); no request got
      // past authentication (the handler logged nothing); and claude only ever
      // asked /mcp or the OAuth paths (which answer 404), nothing else.
      expect(run.ms).toBeLessThan(CLAUDE_TIMEOUT_MS);
      expect(mcpLog.length).toBe(handledBefore);
      expect(requests.length).toBeGreaterThan(0);
      for (const request of requests) {
        expect(request).toMatch(/^[A-Z]+ \/(mcp|\.well-known\/|register|authorize|token)/);
      }
    },
    CLAUDE_TIMEOUT_MS + 30_000,
  );
});
