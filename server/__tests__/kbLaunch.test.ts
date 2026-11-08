import * as fs from 'fs';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HookProvider } from '../../core/src/provider.js';
import {
  CAPABILITY_ENV_NAME,
  KB_ALLOWED_TOOLS_FLAG,
  KB_MCP_CONFIG_FLAG,
  KB_TOOL_NAMES,
} from '../src/constants.js';
import { kbLaunchAdditions, withLoopbackNoProxy } from '../src/kbLaunch.js';
import { KbRuntime } from '../src/kbRuntime.js';
import { claudeProvider } from '../src/providers/hook/claude/claude.js';
import { launchStandaloneAgent } from '../src/terminal/standaloneAgentLauncher.js';
import {
  CAPABILITY_ENV_KEY,
  capabilityTokenOf,
  HARNESS_MCP_BASE_URL,
  KbHarness,
  type Spawned,
} from './curatorHarness.js';

/**
 * S3b launch integration (acceptance 6): a KB launch appends exactly one
 * --mcp-config and one --allowedTools group, last; the token lives only under a
 * random PIXEL_AGENTS_CAP_ name in the PTY env; NO_PROXY gets loopback; and
 * every non-KB launch is byte-for-byte what it was.
 */

const ENV_KEYS = [
  CAPABILITY_ENV_NAME,
  'PIXEL_AGENTS_CAP_DEADBEEF',
  'PIXEL_AGENTS_CAPTURE_X',
  'NO_PROXY',
  'no_proxy',
];

interface LaunchOptions {
  kb?: boolean;
  mcpBaseUrl?: (() => string | undefined) | null;
  bypass?: boolean;
  role?: boolean;
  provider?: Partial<HookProvider>;
  directoryPath?: string;
  isKbEnabled?: (workspaceId: string) => boolean;
}

function launch(h: KbHarness, options: LaunchOptions = {}): { id: number | null; spawn: Spawned } {
  const before = h.spawned.length;
  const id = launchStandaloneAgent(
    {
      store: h.store,
      runtime: h.runtime,
      ptyManager: h.manager,
      provider: { ...claudeProvider, getSessionDirs: () => [h.projectDir], ...options.provider },
      capabilities: h.capabilities,
      isKbEnabled:
        options.isKbEnabled ?? (options.kb === undefined ? undefined : () => options.kb === true),
      kb:
        options.mcpBaseUrl === null
          ? undefined
          : { mcpBaseUrl: options.mcpBaseUrl ?? (() => HARNESS_MCP_BASE_URL) },
    },
    {
      directoryPath: options.directoryPath,
      bypassPermissions: options.bypass,
      role: options.role
        ? { name: 'reviewer', snapshotPath: path.join(h.tempHome, 'reviewer.md') }
        : undefined,
    },
  );
  expect(h.spawned.length).toBe(before + 1);
  return { id, spawn: h.spawned[h.spawned.length - 1] };
}

/** argv and env with the random session id normalized, for byte comparisons. */
function shape(h: KbHarness, id: number | null, spawn: Spawned): string {
  const sessionId = h.store.get(id!)!.sessionId;
  return JSON.stringify({
    file: spawn.file,
    args: spawn.args.map((arg) => (arg === sessionId ? '<session>' : arg)),
    env: spawn.options.env,
    cwd: spawn.options.cwd,
  });
}

describe('KB launch integration', () => {
  let h: KbHarness;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
    h = new KbHarness();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    h.dispose();
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it('appends one --mcp-config and one --allowedTools group, last, in every combination', () => {
    for (const combo of [
      { bypass: false, role: false },
      { bypass: false, role: true },
      { bypass: true, role: false },
      { bypass: true, role: true },
    ]) {
      const { id, spawn } = launch(h, { kb: true, ...combo });
      const sessionId = h.store.get(id!)!.sessionId;
      const env = spawn.options.env!;
      const envName = Object.keys(env).find((key) => CAPABILITY_ENV_KEY.test(key))!;
      const config = JSON.parse(spawn.args[spawn.args.indexOf(KB_MCP_CONFIG_FLAG) + 1]) as {
        mcpServers: Record<string, { type: string; url: string; headers: Record<string, string> }>;
      };
      const [serverName] = Object.keys(config.mcpServers);

      const expected = ['--session-id', sessionId];
      if (combo.bypass) expected.push('--dangerously-skip-permissions');
      if (combo.role) {
        expected.push('--append-system-prompt-file', path.join(h.tempHome, 'reviewer.md'));
      }
      expected.push(
        KB_MCP_CONFIG_FLAG,
        JSON.stringify(config),
        KB_ALLOWED_TOOLS_FLAG,
        ...KB_TOOL_NAMES.map((tool) => `mcp__${serverName}__${tool}`),
      );
      expect(spawn.args).toEqual(expected);
      expect(spawn.args.at(-1)).toBe(`mcp__${serverName}__kb_my_proposals`);
      expect(spawn.args.filter((arg) => arg === KB_MCP_CONFIG_FLAG)).toHaveLength(1);
      expect(spawn.args.filter((arg) => arg === KB_ALLOWED_TOOLS_FLAG)).toHaveLength(1);

      expect(config.mcpServers[serverName]).toEqual({
        type: 'http',
        url: `${HARNESS_MCP_BASE_URL}/mcp`,
        headers: { Authorization: `Bearer \${${envName}}` },
      });
      expect(env[envName]).toMatch(/^pxa_kb_[A-Za-z0-9_-]{43}$/);
      expect(h.capabilities.verify(env[envName])?.agentId).toBe(id);
    }
  });

  it('picks fresh, well-formed names on every launch', () => {
    const names = new Set<string>();
    const vars = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const { spawn } = launch(h, { kb: true });
      const config = JSON.parse(spawn.args[spawn.args.indexOf(KB_MCP_CONFIG_FLAG) + 1]) as {
        mcpServers: Record<string, unknown>;
      };
      const [serverName] = Object.keys(config.mcpServers);
      expect(serverName).toMatch(/^pixel-agents-kb-[0-9a-f]{8}$/);
      const envName = Object.keys(spawn.options.env!).find((key) => CAPABILITY_ENV_KEY.test(key))!;
      expect(envName).toMatch(/^PIXEL_AGENTS_CAP_[0-9A-F]{8}$/);
      names.add(serverName);
      vars.add(envName);
    }
    expect(names.size).toBe(5);
    expect(vars.size).toBe(5);
  });

  it('keeps the token out of argv, logs, broadcasts, existingAgents and persistence', () => {
    const logged: string[] = [];
    for (const level of ['log', 'warn', 'error', 'info', 'debug'] as const) {
      vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
        logged.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
      });
    }
    const { spawn } = launch(h, { kb: true });
    const token = capabilityTokenOf(spawn.options.env)!;
    const replies = h.send({ type: 'webviewReady' });
    h.store.persist();
    const persisted = fs.readFileSync(
      path.join(h.tempHome, '.pixel-agents', 'standalone-state.json'),
      'utf-8',
    );
    const secret = token.slice('pxa_kb_'.length);
    for (const haystack of [
      spawn.args.join('\0'),
      logged.join('\n'),
      JSON.stringify(h.broadcasts),
      JSON.stringify(replies),
      persisted,
      JSON.stringify([...h.store.values()]),
    ]) {
      expect(haystack).not.toContain(secret);
    }
    expect(replies.some((m) => m.type === 'existingAgents')).toBe(true);
    // Exactly one env entry carries it: the random variable.
    const carriers = Object.entries(spawn.options.env!).filter(([, value]) =>
      value.includes(secret),
    );
    expect(carriers.map(([key]) => CAPABILITY_ENV_KEY.test(key))).toEqual([true]);
  });

  it('strips every inherited or provider-planted capability variable, keeping look-alikes', () => {
    process.env[CAPABILITY_ENV_NAME] = 'inherited-legacy';
    process.env.PIXEL_AGENTS_CAP_DEADBEEF = 'inherited-random';
    process.env.PIXEL_AGENTS_CAPTURE_X = 'not-a-capability';
    const { spawn } = launch(h, {
      kb: true,
      provider: {
        buildLaunchCommand: (sessionId, cwd, opts) => ({
          ...claudeProvider.buildLaunchCommand!(sessionId, cwd, opts),
          env: { PWD: cwd, PIXEL_AGENTS_CAP_0BADF00D: 'planted', [CAPABILITY_ENV_NAME]: 'planted' },
        }),
      },
    });
    const env = spawn.options.env!;
    const capKeys = Object.keys(env).filter(
      (key) => key.startsWith('PIXEL_AGENTS_CAP_') || key === CAPABILITY_ENV_NAME,
    );
    expect(capKeys).toHaveLength(1);
    expect(capKeys[0]).toMatch(CAPABILITY_ENV_KEY);
    expect(env[capKeys[0]]).not.toBe('planted');
    expect(env.PIXEL_AGENTS_CAPTURE_X).toBe('not-a-capability');
  });

  it('appends loopback to NO_PROXY and no_proxy, keeping what was there, without duplicates', () => {
    process.env.NO_PROXY = 'corp.example, localhost';
    const { spawn } = launch(h, {
      kb: true,
      provider: {
        buildLaunchCommand: (sessionId, cwd, opts) => ({
          ...claudeProvider.buildLaunchCommand!(sessionId, cwd, opts),
          env: { PWD: cwd, no_proxy: '.internal,::1' },
        }),
      },
    });
    expect(spawn.options.env!.NO_PROXY).toBe('corp.example, localhost,127.0.0.1,::1');
    expect(spawn.options.env!.no_proxy).toBe('.internal,::1,127.0.0.1,localhost');

    const fresh = launch(h, { kb: true }).spawn.options.env!;
    expect(fresh.NO_PROXY).toBe('corp.example, localhost,127.0.0.1,::1');
    expect(fresh.no_proxy).toBe('127.0.0.1,localhost,::1');
  });

  it('withLoopbackNoProxy appends only what is missing', () => {
    expect(withLoopbackNoProxy(undefined)).toBe('127.0.0.1,localhost,::1');
    expect(withLoopbackNoProxy('')).toBe('127.0.0.1,localhost,::1');
    expect(withLoopbackNoProxy('a,b,')).toBe('a,b,127.0.0.1,localhost,::1');
    expect(withLoopbackNoProxy('127.0.0.1,LOCALHOST,::1')).toBe('127.0.0.1,LOCALHOST,::1');
    expect(withLoopbackNoProxy('x')).toBe('x,127.0.0.1,localhost,::1');
  });

  it('kbLaunchAdditions names only the variable in argv', () => {
    const additions = kbLaunchAdditions('http://127.0.0.1:9', {}, (size) =>
      Buffer.alloc(size, 0xab),
    );
    expect(additions.serverName).toBe('pixel-agents-kb-abababab');
    expect(additions.envName).toBe('PIXEL_AGENTS_CAP_ABABABAB');
    expect(additions.args).toEqual([
      KB_MCP_CONFIG_FLAG,
      '{"mcpServers":{"pixel-agents-kb-abababab":{"type":"http","url":"http://127.0.0.1:9/mcp","headers":{"Authorization":"Bearer ${PIXEL_AGENTS_CAP_ABABABAB}"}}}}',
      KB_ALLOWED_TOOLS_FLAG,
      'mcp__pixel-agents-kb-abababab__kb_list',
      'mcp__pixel-agents-kb-abababab__kb_read',
      'mcp__pixel-agents-kb-abababab__kb_propose',
      'mcp__pixel-agents-kb-abababab__kb_my_proposals',
    ]);
  });

  describe('every non-KB launch is byte-for-byte the pre-KB one', () => {
    /** The launch with nothing KB-related injected at all. */
    function baseline(options: LaunchOptions = {}): string {
      const { id, spawn } = launch(h, { ...options, mcpBaseUrl: null });
      return shape(h, id, spawn);
    }

    beforeEach(() => {
      process.env.NO_PROXY = 'corp.example';
      process.env[CAPABILITY_ENV_NAME] = 'inherited';
    });

    it('KB off for the Workspace', () => {
      const expected = baseline();
      const { id, spawn } = launch(h, { kb: false });
      expect(shape(h, id, spawn)).toBe(expected);
      expect(h.capabilities.size).toBe(0);
    });

    it('base URL unknown, or no kb injected', () => {
      const expected = baseline();
      for (const mcpBaseUrl of [() => undefined, null]) {
        const { id, spawn } = launch(h, { kb: true, mcpBaseUrl });
        expect(shape(h, id, spawn)).toBe(expected);
      }
      expect(h.capabilities.size).toBe(0);
    });

    it('a non-loopback bind, a reused server, an embedded host (through KbRuntime)', () => {
      const expected = baseline({ bypass: true, role: true });
      const nonLoopback = new KbRuntime({ bindHost: '0.0.0.0', instance: 'x' });
      nonLoopback.serverListening(4000);
      const reused = new KbRuntime({ bindHost: '127.0.0.1', instance: 'x' }); // never listening
      const embedded = new KbRuntime({ bindHost: '127.0.0.1', embedded: true, instance: 'x' });
      embedded.serverListening(4000);
      for (const kb of [nonLoopback, reused, embedded]) {
        expect(kb.mcpBaseUrl()).toBeUndefined();
        const { id, spawn } = launch(h, {
          isKbEnabled: kb.isKbEnabled,
          mcpBaseUrl: kb.mcpBaseUrl,
          bypass: true,
          role: true,
        });
        expect(shape(h, id, spawn)).toBe(expected);
      }
      expect(h.capabilities.size).toBe(0);
    });
  });
});
