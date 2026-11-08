import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_WORKSPACE_ID } from '../../core/src/constants.js';
import { KB_SETTINGS_FILE_MAX_BYTES } from '../src/constants.js';
import { KbPaths, readSettingsJsonSync } from '../src/kbFiles.js';
import { KbRuntime, kbWorkspaceIdsFor, mcpBaseUrlFor } from '../src/kbRuntime.js';
import { KbHarness } from './curatorHarness.js';
import {
  approve,
  makeWorkspaceDirs,
  OTHER_WS,
  proposer,
  singleStore,
  submitCreate,
  type TempHome,
  useTempHome,
  WS,
} from './kbHarness.js';

/**
 * kbRuntime (S3b): the synchronous launch-time KB check (acceptance 7), the
 * MCP base URL rules, curatorsLoaded.kbWorkspaceIds (acceptance 8) and the
 * voiding of a removed Workspace's proposals (acceptance 9).
 */

/** Every path under `root`, with its mode, so "nothing was created" compares. */
function tree(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      const stats = fs.lstatSync(full);
      out.push(`${path.relative(root, full)} ${(stats.mode & 0o777).toString(8)}`);
      if (stats.isDirectory() && !stats.isSymbolicLink()) walk(full);
    }
  };
  walk(root);
  return out;
}

function writeSettings(t: TempHome, ws: string, content: string): void {
  makeWorkspaceDirs(t.paths, ws);
  fs.writeFileSync(t.paths.settingsFile(ws), content, { mode: 0o600 });
}

const ENABLED = JSON.stringify({ version: 1, kbEnabled: true });

describe('kbRuntime: the synchronous KB check', () => {
  let t: TempHome;

  beforeEach(() => {
    t = useTempHome();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => t.restore());

  function runtime(): KbRuntime {
    const kb = new KbRuntime({
      bindHost: '127.0.0.1',
      paths: t.paths,
      store: singleStore(t.paths),
      instance: 'test',
    });
    kb.serverListening(4321);
    return kb;
  }

  /** The /mcp side's view of the same Workspace. */
  async function asyncView(kb: KbRuntime, ws: string): Promise<boolean> {
    const read = await kb.store.readSettings(ws);
    return read.ok && read.settings.kbEnabled;
  }

  it('is on for private directories, a 0600 file and kbEnabled:true', async () => {
    writeSettings(t, WS, ENABLED);
    const kb = runtime();
    expect(kb.isKbEnabled(WS)).toBe(true);
    expect(await asyncView(kb, WS)).toBe(true);
    // Another Workspace without its own settings stays off.
    expect(kb.isKbEnabled(OTHER_WS)).toBe(false);
  });

  const offCases: Array<{ name: string; ws?: string; setup: () => void }> = [
    { name: 'no KB root at all', setup: () => {} },
    { name: 'a missing settings file', setup: () => makeWorkspaceDirs(t.paths, WS) },
    { name: 'a missing field', setup: () => writeSettings(t, WS, '{"version":1}') },
    { name: 'kbEnabled false', setup: () => writeSettings(t, WS, '{"kbEnabled":false}') },
    { name: 'a corrupt file', setup: () => writeSettings(t, WS, '{"kbEnabled":tru') },
    { name: 'a wrong type', setup: () => writeSettings(t, WS, '{"kbEnabled":"yes"}') },
    { name: 'an unknown key', setup: () => writeSettings(t, WS, '{"kbEnabled":true,"x":1}') },
    {
      name: 'a file over 4 KiB',
      setup: () =>
        writeSettings(t, WS, `{"kbEnabled":true}${' '.repeat(KB_SETTINGS_FILE_MAX_BYTES)}`),
    },
    {
      name: 'a FIFO',
      setup: () => {
        makeWorkspaceDirs(t.paths, WS);
        execFileSync('mkfifo', [t.paths.settingsFile(WS)]);
      },
    },
    {
      name: 'a symlink to a valid file',
      setup: () => {
        makeWorkspaceDirs(t.paths, WS);
        const real = path.join(t.home, 'elsewhere.json');
        fs.writeFileSync(real, ENABLED, { mode: 0o600 });
        fs.symlinkSync(real, t.paths.settingsFile(WS));
      },
    },
    {
      name: 'an invalid Workspace id',
      ws: '../default',
      setup: () => writeSettings(t, WS, ENABLED),
    },
    {
      name: 'an upper-case Workspace id',
      ws: OTHER_WS.toUpperCase(),
      setup: () => writeSettings(t, OTHER_WS, ENABLED),
    },
    {
      name: 'a KB root of mode 0755',
      setup: () => {
        writeSettings(t, WS, ENABLED);
        fs.chmodSync(t.paths.root, 0o755);
      },
    },
    {
      name: 'a Workspace directory of mode 0755',
      setup: () => {
        writeSettings(t, WS, ENABLED);
        fs.chmodSync(t.paths.workspaceDir(WS), 0o755);
      },
    },
    {
      name: 'a Workspace directory that is a symlink',
      setup: () => {
        const real = path.join(t.home, 'real-ws');
        fs.mkdirSync(path.dirname(t.paths.root), { recursive: true, mode: 0o700 });
        fs.mkdirSync(t.paths.root, { mode: 0o700 });
        fs.chmodSync(t.paths.root, 0o700);
        fs.mkdirSync(real, { mode: 0o700 });
        fs.chmodSync(real, 0o700);
        fs.writeFileSync(path.join(real, 'settings.json'), ENABLED, { mode: 0o600 });
        fs.symlinkSync(real, t.paths.workspaceDir(WS));
      },
    },
    {
      name: 'a proposals directory of mode 0755',
      setup: () => {
        writeSettings(t, WS, ENABLED);
        fs.chmodSync(t.paths.proposalsDir(WS), 0o755);
      },
    },
    {
      name: 'directories owned by someone else',
      setup: () => {
        writeSettings(t, WS, ENABLED);
        const uid = process.getuid!();
        vi.spyOn(process, 'getuid').mockReturnValue(uid + 1);
      },
    },
  ];

  for (const c of offCases) {
    it(`is off, creates nothing and agrees with readSettings: ${c.name}`, async () => {
      c.setup();
      const kb = runtime();
      const ws = c.ws ?? WS;
      const before = tree(t.home);
      expect(kb.isKbEnabled(ws)).toBe(false);
      expect(tree(t.home)).toEqual(before);
      expect(await asyncView(kb, ws)).toBe(false);
      expect(tree(t.home)).toEqual(before);
    });
  }

  it('readSettingsJsonSync returns the parsed JSON only for a clean read', () => {
    writeSettings(t, WS, ENABLED);
    expect(readSettingsJsonSync(t.paths, WS)).toEqual({ version: 1, kbEnabled: true });
    fs.chmodSync(t.paths.root, 0o711);
    expect(readSettingsJsonSync(t.paths, WS)).toBeUndefined();
  });

  it('is off before the server listens, when embedded, and when bound off loopback', () => {
    writeSettings(t, WS, ENABLED);
    const store = singleStore(t.paths);
    const notYet = new KbRuntime({ bindHost: '127.0.0.1', paths: t.paths, store });
    expect(notYet.isKbEnabled(WS)).toBe(false);
    notYet.serverListening(1234);
    expect(notYet.isKbEnabled(WS)).toBe(true);

    const embedded = new KbRuntime({
      bindHost: '127.0.0.1',
      paths: t.paths,
      store,
      embedded: true,
    });
    embedded.serverListening(1234);
    expect(embedded.mcpBaseUrl()).toBeUndefined();
    expect(embedded.isKbEnabled(WS)).toBe(false);

    for (const bindHost of ['0.0.0.0', '::', '192.168.1.20', 'my-mac.tailnet.ts.net']) {
      const remote = new KbRuntime({ bindHost, paths: t.paths, store });
      remote.serverListening(1234);
      expect(remote.mcpBaseUrl()).toBeUndefined();
      expect(remote.isKbEnabled(WS)).toBe(false);
    }
  });

  it('gives every runtime its own random instance id', () => {
    const a = new KbRuntime({ bindHost: '127.0.0.1', paths: t.paths, store: singleStore(t.paths) });
    const b = new KbRuntime({ bindHost: '127.0.0.1', paths: t.paths, store: singleStore(t.paths) });
    expect(a.instance).toMatch(/^[0-9a-f-]{36}$/);
    expect(a.instance).not.toBe(b.instance);
  });
});

describe('kbRuntime: base URL and Workspace list helpers', () => {
  it('addresses loopback binds, 127.0.0.1 for localhost and brackets for ::1', () => {
    expect(mcpBaseUrlFor('127.0.0.1', 80)).toBe('http://127.0.0.1:80');
    expect(mcpBaseUrlFor('localhost', 3100)).toBe('http://127.0.0.1:3100');
    expect(mcpBaseUrlFor('::1', 3100)).toBe('http://[::1]:3100');
    expect(mcpBaseUrlFor('[::1]', 3100)).toBe('http://[::1]:3100');
    expect(mcpBaseUrlFor('0.0.0.0', 3100)).toBeUndefined();
    expect(mcpBaseUrlFor('10.0.0.2', 3100)).toBeUndefined();
  });

  it('kbWorkspaceIdsFor puts default first, keeps order, drops duplicates and off ones', () => {
    const on = new Set([DEFAULT_WORKSPACE_ID, 'b', 'c']);
    expect(
      kbWorkspaceIdsFor(['c', DEFAULT_WORKSPACE_ID, 'a', 'b', 'c'], (id) => on.has(id)),
    ).toEqual([DEFAULT_WORKSPACE_ID, 'c', 'b']);
    expect(kbWorkspaceIdsFor(['a'], () => false)).toEqual([]);
  });
});

describe('curatorsLoaded.kbWorkspaceIds (acceptance 8)', () => {
  let h: KbHarness;

  beforeEach(() => {
    h = new KbHarness();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    h.dispose();
  });

  const loaded = (overrides: Parameters<KbHarness['ctx']>[0] = {}) =>
    h.send({ type: 'webviewReady' }, h.ctx(overrides)).find((m) => m.type === 'curatorsLoaded');

  it('lists default and the on Workspaces only, default first, available while any is on', () => {
    const alpha = h.workspace('alpha');
    const beta = h.workspace('beta');
    expect(loaded({ isKbEnabled: (id) => id !== alpha.id })).toEqual({
      type: 'curatorsLoaded',
      available: true,
      curators: [],
      kbWorkspaceIds: [DEFAULT_WORKSPACE_ID, beta.id],
    });
    expect(loaded({ isKbEnabled: (id) => id === beta.id })).toEqual({
      type: 'curatorsLoaded',
      available: true,
      curators: [],
      kbWorkspaceIds: [beta.id],
    });
  });

  it('is unavailable and empty when every KB is off, when not wired, or with a part missing', () => {
    h.workspace('alpha');
    const empty = { type: 'curatorsLoaded', available: false, curators: [], kbWorkspaceIds: [] };
    expect(loaded({ isKbEnabled: () => false })).toEqual(empty);
    expect(loaded({ isKbEnabled: undefined })).toEqual(empty);
    for (const missing of [
      { ptyManager: undefined },
      { runtime: undefined },
      { capabilities: undefined },
      { curators: undefined },
    ]) {
      expect(loaded(missing)).toEqual(empty);
    }
  });

  it('asks isKbEnabled once per Workspace, never twice for default', () => {
    const alpha = h.workspace('alpha');
    const asked: string[] = [];
    loaded({
      isKbEnabled: (id) => {
        asked.push(id);
        return true;
      },
    });
    expect(asked).toEqual([DEFAULT_WORKSPACE_ID, alpha.id]);
  });
});

describe('removing a Workspace voids its proposals (acceptance 9)', () => {
  let h: KbHarness;

  beforeEach(() => {
    h = new KbHarness();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    h.dispose();
  });

  it('calls ctx.kb.voidWorkspaceProposals once with the removed id', () => {
    const ws = h.workspace('alpha');
    const voided: string[] = [];
    const replies = h.send(
      { type: 'removeWorkspace', id: ws.id },
      h.ctx({
        kb: {
          mcpBaseUrl: () => undefined,
          voidWorkspaceProposals: async (id) => {
            voided.push(id);
          },
        },
      }),
    );
    expect(replies).toEqual([]);
    expect(voided).toEqual([ws.id]);
  });

  it('a throwing or failing void never blocks the removal or its reply', async () => {
    for (const voidWorkspaceProposals of [
      () => {
        throw new Error('sync');
      },
      () => Promise.reject(new Error('async')),
    ]) {
      const ws = h.workspace(`ws-${h.broadcasts.length}`);
      const before = h.broadcasts.length;
      const replies = h.send(
        { type: 'removeWorkspace', id: ws.id },
        h.ctx({
          kb: {
            mcpBaseUrl: () => undefined,
            voidWorkspaceProposals: voidWorkspaceProposals as (id: string) => Promise<void>,
          },
        }),
      );
      expect(replies).toEqual([]);
      const listed = h.broadcasts.slice(before).find((m) => m.type === 'workspacesLoaded') as
        { workspaces: Array<{ id: string }> } | undefined;
      expect(listed?.workspaces.some((w) => w.id === ws.id)).toBe(false);
    }
    await new Promise((resolve) => setImmediate(resolve));
  });

  it('skips voiding without ctx.kb', () => {
    const ws = h.workspace('alpha');
    expect(h.send({ type: 'removeWorkspace', id: ws.id }, h.ctx({ kb: undefined }))).toEqual([]);
  });

  it('with the real store: pending and pending_operator turn voided, others stay', async () => {
    const ws = h.workspace('alpha');
    const paths = new KbPaths(path.join(h.tempHome, '.pixel-agents', 'kb'));
    const store = singleStore(paths);
    expect((await store.writeSettings(ws.id, { kbEnabled: true })).ok).toBe(true);
    // An entry to replace, then a pending create and a pending_operator replace.
    const seed = await submitCreate(store, 'Seed', 'seed text', proposer(1), ws.id);
    expect((await approve(store, seed, ws.id)).ok).toBe(true);
    const entries = await store.listEntries(ws.id);
    if (!entries.ok) throw new Error('list failed');
    const pending = await submitCreate(store, 'Waiting', 'text', proposer(2), ws.id);
    const replace = await store.submitProposal(ws.id, {
      kind: 'replace',
      targetEntryId: entries.entries[0].id,
      content: 'new text',
      proposer: proposer(3),
    });
    if (!replace.ok) throw new Error('replace failed');
    const operatorWait = await approve(store, replace.proposal, ws.id);
    expect(operatorWait).toMatchObject({ ok: true, state: 'pending_operator' });

    const kb = new KbRuntime({ bindHost: '127.0.0.1', paths, store });
    const done = vi.spyOn(kb, 'voidWorkspaceProposals');
    h.send({ type: 'removeWorkspace', id: ws.id }, h.ctx({ kb }));
    expect(done).toHaveBeenCalledTimes(1);
    await done.mock.results[0].value;

    const states = await store.listProposals(ws.id);
    if (!states.ok) throw new Error('list proposals failed');
    const byId = Object.fromEntries(states.proposals.map((p) => [p.id, p.state]));
    expect(byId[pending.id]).toBe('voided');
    expect(byId[replace.proposal.id]).toBe('voided');
    expect(byId[seed.id]).toBe('approved');
    // The KB data stays on disk.
    expect(fs.existsSync(paths.indexFile(ws.id))).toBe(true);
  });

  it('a failing store result is logged with a fixed line and never rejects', async () => {
    const paths = new KbPaths(path.join(h.tempHome, 'kb'));
    const store = singleStore(paths);
    const kb = new KbRuntime({ bindHost: '127.0.0.1', paths, store });
    const errors: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.join(' '));
    });
    vi.spyOn(store, 'voidWorkspaceProposals').mockResolvedValueOnce({
      ok: false,
      code: 'locked',
      reason: 'x',
    });
    await expect(kb.voidWorkspaceProposals(WS)).resolves.toBeUndefined();
    vi.spyOn(store, 'voidWorkspaceProposals').mockRejectedValueOnce(new Error('boom /secret/path'));
    await expect(kb.voidWorkspaceProposals(WS)).resolves.toBeUndefined();
    expect(errors).toHaveLength(2);
    for (const line of errors) {
      expect(line).toMatch(
        /^\[Pixel Agents\] KB: the removed Workspace's proposals could not be voided/,
      );
      expect(line).not.toContain('/secret/path');
    }
  });
});
