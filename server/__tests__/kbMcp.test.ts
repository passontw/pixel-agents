import * as crypto from 'crypto';
import type { FastifyInstance } from 'fastify';
import * as fs from 'fs';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_WORKSPACE_ID } from '../../core/src/constants.js';
import {
  KB_INVALID_CONTENT_REASON,
  KB_INVALID_TITLE_REASON,
  KB_MCP_DISABLED_MESSAGE,
  KB_MCP_INSTRUCTIONS,
  KB_MCP_LOCKED_MESSAGE,
  KB_MCP_UNAVAILABLE_MESSAGE,
  KB_NOT_FOUND_REASON,
  KB_PENDING_PER_PROPOSER_MAX,
  KB_PENDING_TTL_MS,
  KB_QUOTA_PROPOSER_REASON,
  KB_TITLE_CONFLICT_REASON,
  KB_TOO_LARGE_REASON,
} from '../src/constants.js';
import { createHttpServer, serializeRequestForLog } from '../src/httpServer.js';
import { KbPaths } from '../src/kbFiles.js';
import { KbRuntime } from '../src/kbRuntime.js';
import type { KbStore } from '../src/kbStore.js';
import { KbHarness } from './curatorHarness.js';
import { approve, proposer, singleStore, submitCreate } from './kbHarness.js';

/**
 * POST /mcp (S3b): the JSON-RPC protocol (acceptance 2), the four tools and
 * Workspace isolation (acceptance 5), the removal race (acceptance 5/9) and
 * what never leaks (acceptance 10). Requests go through Fastify inject on a
 * server bound to 127.0.0.1 with an ephemeral port.
 */

const INSTANCE = '33333333-3333-4333-8333-333333333333';
const SERVER_TOKEN = '44444444-4444-4444-8444-444444444444';

interface Env {
  app: FastifyInstance;
  store: KbStore;
  paths: KbPaths;
  kb: KbRuntime;
  clock: { now: number };
}

async function startServer(h: KbHarness): Promise<Env> {
  const paths = new KbPaths(path.join(h.tempHome, '.pixel-agents', 'kb'));
  const clock = { now: Date.now() };
  const store = singleStore(paths, { now: () => clock.now });
  const kb = new KbRuntime({ bindHost: '127.0.0.1', paths, store, instance: INSTANCE });
  const { app, port } = await createHttpServer({
    embedded: false,
    host: '127.0.0.1',
    port: 0,
    token: SERVER_TOKEN,
    store: h.store,
    runtime: h.runtime,
    ptyManager: h.manager,
    capabilities: h.capabilities,
    curators: h.curators,
    kb,
    isKbEnabled: kb.isKbEnabled,
  });
  kb.serverListening(port);
  return { app, store, paths, kb, clock };
}

let nextId = 1;

function post(env: Env, token: string | undefined, payload: unknown, headers = {}) {
  return env.app.inject({
    method: 'POST',
    url: '/mcp',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}

async function request(env: Env, token: string, method: string, params?: unknown) {
  const res = await post(env, token, { jsonrpc: '2.0', id: nextId++, method, params });
  return { status: res.statusCode, body: res.json() as Record<string, unknown>, raw: res.body };
}

/** A tool call; returns the decoded text payload and the raw reply text. */
async function call(env: Env, token: string, name: string, args: Record<string, unknown> = {}) {
  const { status, body, raw } = await request(env, token, 'tools/call', { name, arguments: args });
  expect(status).toBe(200);
  const result = body.result as { content: Array<{ type: string; text: string }>; isError?: true };
  expect(result.content).toHaveLength(1);
  expect(result.content[0].type).toBe('text');
  const text = result.content[0].text;
  const payload = JSON.parse(text) as Record<string, unknown>;
  const keys = Object.keys(payload);
  expect(keys[0]).toBe('untrusted');
  if (keys.includes('content')) expect(keys.at(-1)).toBe('content');
  return { payload, isError: result.isError === true, text, raw };
}

describe('/mcp', () => {
  let h: KbHarness;
  let env: Env;

  beforeEach(async () => {
    h = new KbHarness();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    env = await startServer(h);
  });

  afterEach(async () => {
    await env.app.close();
    vi.restoreAllMocks();
    h.dispose();
  });

  /** A KB-on Workspace with one approved entry; returns its id and an agent token. */
  async function kbWorkspace(
    name?: string,
    entry = { title: 'Style guide', content: 'Use tabs.' },
  ) {
    const ws = name ? h.workspace(name) : { id: DEFAULT_WORKSPACE_ID, dir: undefined };
    expect((await env.store.writeSettings(ws.id, { kbEnabled: true })).ok).toBe(true);
    const created = await submitCreate(env.store, entry.title, entry.content, proposer(900), ws.id);
    expect((await approve(env.store, created, ws.id)).ok).toBe(true);
    const listed = await env.store.listEntries(ws.id);
    if (!listed.ok) throw new Error('list failed');
    const agent = h.launch({ kb: true, directoryPath: ws.dir });
    return { ws, entryId: listed.entries[0].id, token: agent.token!, agentId: agent.id! };
  }

  // ── Protocol (acceptance 2) ─────────────────────────────────

  describe('protocol', () => {
    let token: string;
    beforeEach(async () => {
      token = (await kbWorkspace()).token;
    });

    it('initialize echoes a supported version and answers the newest otherwise', async () => {
      for (const version of ['2025-11-25', '2025-06-18', '2025-03-26']) {
        const { status, body } = await request(env, token, 'initialize', {
          protocolVersion: version,
          capabilities: {},
          clientInfo: { name: 'test', version: '1' },
        });
        expect(status).toBe(200);
        expect(body.result).toEqual({
          protocolVersion: version,
          capabilities: { tools: {} },
          serverInfo: { name: 'pixel-agents-kb', version: expect.any(String) },
          instructions: KB_MCP_INSTRUCTIONS,
        });
      }
      for (const version of ['2024-11-05', '2099-01-01', 7, undefined]) {
        const { body } = await request(env, token, 'initialize', { protocolVersion: version });
        expect((body.result as { protocolVersion: string }).protocolVersion).toBe('2025-11-25');
      }
    });

    it('accepts notifications with 202 and no body', async () => {
      for (const method of ['notifications/initialized', 'notifications/whatever']) {
        const res = await post(env, token, { jsonrpc: '2.0', method });
        expect(res.statusCode).toBe(202);
        expect(res.body).toBe('');
      }
    });

    it('answers ping, and lists the four tools with closed schemas', async () => {
      expect((await request(env, token, 'ping')).body).toEqual({
        jsonrpc: '2.0',
        id: nextId - 1,
        result: {},
      });
      const { body } = await request(env, token, 'tools/list');
      const tools = (body.result as { tools: Array<Record<string, unknown>> }).tools;
      expect(tools.map((t) => t.name)).toEqual([
        'kb_list',
        'kb_read',
        'kb_propose',
        'kb_my_proposals',
      ]);
      for (const tool of tools) {
        const schema = tool.inputSchema as Record<string, unknown>;
        expect(schema.type).toBe('object');
        expect(schema.additionalProperties).toBe(false);
        expect(Object.keys(schema.properties as object)).not.toContain('workspaceId');
        expect(Object.keys(schema.properties as object)).not.toContain('agentId');
        expect(typeof tool.description).toBe('string');
      }
    });

    it('answers -32601 for unknown methods, server/discover included', async () => {
      for (const method of ['server/discover', 'resources/list', 'prompts/list', 'nope']) {
        const { status, body } = await request(env, token, method);
        expect(status).toBe(200);
        expect(body.error).toEqual({ code: -32601, message: 'Method not found' });
      }
    });

    it('answers -32700 for bad JSON and -32600 for a batch or a malformed message', async () => {
      const bad = await post(env, token, '{"jsonrpc":"2.0",');
      expect(bad.statusCode).toBe(400);
      expect(bad.json()).toEqual({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      });
      for (const payload of [
        [{ jsonrpc: '2.0', id: 1, method: 'ping' }],
        '"ping"',
        '42',
        'null',
        { id: 1, method: 'ping' },
        { jsonrpc: '1.0', id: 1, method: 'ping' },
        { jsonrpc: '2.0', id: 1 },
        { jsonrpc: '2.0', id: 1, method: 5 },
      ]) {
        const res = await post(env, token, payload);
        expect(res.statusCode).toBe(400);
        expect((res.json() as { error: { code: number } }).error.code).toBe(-32600);
      }
    });

    it('accepts an integer id or a string of at most 128 characters, nothing else', async () => {
      for (const id of [0, 7, -3, 'a', 'x'.repeat(128)]) {
        const res = await post(env, token, { jsonrpc: '2.0', id, method: 'ping' });
        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ jsonrpc: '2.0', id, result: {} });
      }
      for (const id of [1.5, 'x'.repeat(129), null, true, {}, [1]]) {
        const res = await post(env, token, { jsonrpc: '2.0', id, method: 'ping' });
        expect(res.statusCode).toBe(400);
        expect(res.json()).toEqual({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32600, message: 'Invalid Request' },
        });
      }
    });

    it('answers -32602 for bad params', async () => {
      for (const params of [
        undefined,
        [],
        { name: 'kb_nope' },
        { name: 'kb_list', arguments: [] },
        { name: 'kb_list', arguments: {}, extra: 1 },
        { name: 'kb_list', arguments: { x: 1 } },
        { name: 'kb_read', arguments: {} },
        { name: 'kb_read', arguments: { id: 5 } },
        { name: 'kb_propose', arguments: { kind: 'merge' } },
        { name: 'kb_my_proposals', arguments: { state: 'open' } },
      ]) {
        const { status, body } = await request(env, token, 'tools/call', params);
        expect(status).toBe(200);
        expect(body.error).toEqual({ code: -32602, message: 'Invalid params' });
      }
      expect((await request(env, token, 'initialize', 'x')).body.error).toEqual({
        code: -32602,
        message: 'Invalid params',
      });
    });

    it('answers 405 (Allow: POST) to every other method and 415 to other content types', async () => {
      for (const method of ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT', 'PATCH'] as const) {
        const res = await env.app.inject({
          method,
          url: '/mcp',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          payload: method === 'GET' || method === 'HEAD' ? undefined : '{}',
        });
        expect(res.statusCode).toBe(405);
        expect(res.headers.allow).toBe('POST');
      }
      for (const type of ['text/plain', 'application/x-www-form-urlencoded', 'application/jsonx']) {
        const res = await post(env, token, '{"jsonrpc":"2.0","id":1,"method":"ping"}', {
          'content-type': type,
        });
        expect(res.statusCode).toBe(415);
        expect(res.json()).toEqual({ error: 'unsupported_media_type' });
      }
      const charset = await post(
        env,
        token,
        { jsonrpc: '2.0', id: 1, method: 'ping' },
        {
          'content-type': 'application/json; charset=utf-8',
        },
      );
      expect(charset.statusCode).toBe(200);
      const none = await env.app.inject({
        method: 'POST',
        url: '/mcp',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(none.statusCode).toBe(415);
    });
  });

  // ── Tools and isolation (acceptance 5) ──────────────────────

  describe('tools', () => {
    it("kb_list and kb_read return the approved entries of the caller's Workspace", async () => {
      const a = await kbWorkspace();
      const list = await call(env, a.token, 'kb_list');
      expect(list.isError).toBe(false);
      expect(list.payload).toEqual({
        untrusted: true,
        kbVersion: 1,
        entries: [
          {
            id: a.entryId,
            title: 'Style guide',
            size: 9,
            version: 1,
            updatedAt: expect.any(String),
          },
        ],
      });
      const read = await call(env, a.token, 'kb_read', { id: a.entryId });
      expect(read.payload).toEqual({
        untrusted: true,
        id: a.entryId,
        title: 'Style guide',
        version: 1,
        sha256: crypto.createHash('sha256').update('Use tabs.').digest('hex'),
        source: 'approved KB entry',
        content: 'Use tabs.',
      });
    });

    it('keeps Workspaces apart: A sees, reads and proposes nothing of B', async () => {
      const a = await kbWorkspace();
      const b = await kbWorkspace('beta', { title: 'Beta secret', content: 'only for beta' });

      const listA = await call(env, a.token, 'kb_list');
      expect(listA.text).not.toContain('Beta secret');
      const readB = await call(env, a.token, 'kb_read', { id: b.entryId });
      expect(readB.isError).toBe(true);
      expect(readB.payload).toEqual({
        untrusted: true,
        error: 'not_found',
        message: KB_NOT_FOUND_REASON,
      });

      const replaceB = await call(env, a.token, 'kb_propose', {
        kind: 'replace',
        targetEntryId: b.entryId,
        content: 'hijack',
      });
      expect(replaceB.payload).toMatchObject({ error: 'not_found' });
      const proposalsB = await env.store.listProposals(b.ws.id, { state: 'pending' });
      expect(proposalsB.ok && proposalsB.proposals).toEqual([]);

      // Nothing an argument says can move the call to B.
      for (const args of [
        { workspaceId: b.ws.id },
        { agentId: b.agentId },
        { id: b.entryId, workspaceId: b.ws.id },
      ]) {
        const name = 'id' in args ? 'kb_read' : 'kb_list';
        const { body } = await request(env, a.token, 'tools/call', { name, arguments: args });
        expect(body.error).toEqual({ code: -32602, message: 'Invalid params' });
      }
    });

    it('refuses an id that is not a lowercase UUID', async () => {
      const a = await kbWorkspace();
      for (const id of [a.entryId.toUpperCase(), 'default', '../index', '', `${a.entryId} `]) {
        const { body } = await request(env, a.token, 'tools/call', {
          name: 'kb_read',
          arguments: { id },
        });
        expect(body.error).toEqual({ code: -32602, message: 'Invalid params' });
      }
    });

    it('answers kb_disabled on every call while the KB is off, running agents included', async () => {
      const a = await kbWorkspace();
      expect((await call(env, a.token, 'kb_list')).isError).toBe(false);
      expect((await env.store.writeSettings(DEFAULT_WORKSPACE_ID, { kbEnabled: false })).ok).toBe(
        true,
      );
      for (const [name, args] of [
        ['kb_list', {}],
        ['kb_read', { id: a.entryId }],
        ['kb_propose', { kind: 'create', title: 'T', content: 'c' }],
        ['kb_my_proposals', {}],
      ] as const) {
        const result = await call(env, a.token, name, args);
        expect(result.isError).toBe(true);
        expect(result.payload).toEqual({
          untrusted: true,
          error: 'kb_disabled',
          message: KB_MCP_DISABLED_MESSAGE,
        });
      }
      // A Workspace with no settings file at all.
      const ws = h.workspace('nosettings');
      const agent = h.launch({ kb: true, directoryPath: ws.dir });
      expect((await call(env, agent.token!, 'kb_list')).payload).toMatchObject({
        error: 'kb_disabled',
      });
    });

    it('maps locked and the storage-health codes to fixed messages', async () => {
      const a = await kbWorkspace();
      const spy = vi.spyOn(env.store, 'listEntries');
      spy.mockResolvedValueOnce({ ok: false, code: 'locked', reason: 'Bearer secret' });
      expect((await call(env, a.token, 'kb_list')).payload).toEqual({
        untrusted: true,
        error: 'locked',
        message: KB_MCP_LOCKED_MESSAGE,
      });
      for (const code of [
        'tampered',
        'corrupt_index',
        'corrupt_settings',
        'unsafe_storage',
        'io',
      ] as const) {
        spy.mockResolvedValueOnce({ ok: false, code, reason: `/Users/someone/${code}` });
        expect((await call(env, a.token, 'kb_list')).payload).toEqual({
          untrusted: true,
          error: 'unavailable',
          message: KB_MCP_UNAVAILABLE_MESSAGE,
        });
      }
      vi.spyOn(env.store, 'readEntry').mockResolvedValueOnce({
        ok: false,
        code: 'tampered',
        reason: 'x',
      });
      const tampered = await call(env, a.token, 'kb_read', { id: a.entryId });
      expect(tampered.payload).toEqual({
        untrusted: true,
        error: 'unavailable',
        message: KB_MCP_UNAVAILABLE_MESSAGE,
      });
      expect(tampered.text).not.toContain('Use tabs.');
      // readSettings failing is the same family.
      vi.spyOn(env.store, 'readSettings').mockResolvedValueOnce({
        ok: false,
        code: 'unsafe_storage',
        reason: 'x',
      });
      expect((await call(env, a.token, 'kb_list')).payload).toMatchObject({ error: 'unavailable' });
    });

    it('a real tampered blob answers the fixed message without content', async () => {
      const a = await kbWorkspace(undefined, { title: 'Blob', content: 'original text' });
      const blobs = fs.readdirSync(env.paths.blobsDir(DEFAULT_WORKSPACE_ID));
      fs.writeFileSync(
        path.join(env.paths.blobsDir(DEFAULT_WORKSPACE_ID), blobs[0]),
        'changed text!',
      );
      const read = await call(env, a.token, 'kb_read', { id: a.entryId });
      expect(read.payload).toEqual({
        untrusted: true,
        error: 'unavailable',
        message: KB_MCP_UNAVAILABLE_MESSAGE,
      });
      expect(read.text).not.toContain('text');
    });

    it('kb_propose records a proposer from the capability, never from the agent', async () => {
      const a = await kbWorkspace();
      const second = h.launch({ kb: true });
      const result = await call(env, a.token, 'kb_propose', {
        kind: 'create',
        title: 'New page',
        content: 'Hello',
      });
      expect(result.payload).toEqual({
        untrusted: true,
        proposalId: expect.stringMatching(/^[0-9a-f-]{36}$/),
        state: 'pending',
        digest: expect.stringMatching(/^[0-9a-f]{64}$/),
        highImpact: false,
      });
      const other = await call(env, second.token!, 'kb_propose', {
        kind: 'replace',
        targetEntryId: a.entryId,
        content: 'Hi',
      });
      expect(other.payload).toMatchObject({ state: 'pending', highImpact: true });

      const claimsA = h.capabilities.verify(a.token)!;
      const claimsB = h.capabilities.verify(second.token!)!;
      const fileA = JSON.parse(
        fs.readFileSync(
          env.paths.proposalFile(DEFAULT_WORKSPACE_ID, result.payload.proposalId as string),
          'utf-8',
        ),
      ) as { proposer: unknown; workspaceId: string };
      const fileB = JSON.parse(
        fs.readFileSync(
          env.paths.proposalFile(DEFAULT_WORKSPACE_ID, other.payload.proposalId as string),
          'utf-8',
        ),
      ) as { proposer: unknown };
      expect(fileA.workspaceId).toBe(DEFAULT_WORKSPACE_ID);
      expect(fileA.proposer).toEqual({
        instance: INSTANCE,
        agentId: claimsA.agentId,
        sessionId: claimsA.sessionId,
        serial: claimsA.serial,
      });
      expect(fileB.proposer).toEqual({
        instance: INSTANCE,
        agentId: claimsB.agentId,
        sessionId: claimsB.sessionId,
        serial: claimsB.serial,
      });
      expect(claimsA.serial).not.toBe(claimsB.serial);

      // A forged proposer is an unknown argument.
      const { body } = await request(env, a.token, 'tools/call', {
        name: 'kb_propose',
        arguments: { kind: 'create', title: 'X', content: 'y', proposer: { agentId: 99 } },
      });
      expect(body.error).toEqual({ code: -32602, message: 'Invalid params' });
    });

    it('maps conflict, invalid, too_large and quota to the fixed reasons', async () => {
      const a = await kbWorkspace();
      expect(
        (
          await call(env, a.token, 'kb_propose', {
            kind: 'create',
            title: 'style GUIDE',
            content: 'x',
          })
        ).payload,
      ).toEqual({ untrusted: true, error: 'conflict', message: KB_TITLE_CONFLICT_REASON });
      expect(
        (
          await call(env, a.token, 'kb_propose', {
            kind: 'create',
            title: 'bad\ttitle',
            content: 'x',
          })
        ).payload,
      ).toEqual({ untrusted: true, error: 'invalid', message: KB_INVALID_TITLE_REASON });
      expect(
        (
          await call(env, a.token, 'kb_propose', {
            kind: 'create',
            title: 'Ctl',
            content: 'a\u0000b',
          })
        ).payload,
      ).toEqual({ untrusted: true, error: 'invalid', message: KB_INVALID_CONTENT_REASON });
      expect(
        (
          await call(env, a.token, 'kb_propose', {
            kind: 'create',
            title: 'Big',
            content: 'x'.repeat(70 * 1024),
          })
        ).payload,
      ).toEqual({ untrusted: true, error: 'too_large', message: KB_TOO_LARGE_REASON });

      for (let i = 0; i < KB_PENDING_PER_PROPOSER_MAX; i++) {
        const ok = await call(env, a.token, 'kb_propose', {
          kind: 'create',
          title: `P${i}`,
          content: 'c',
        });
        expect(ok.payload.state).toBe('pending');
      }
      expect(
        (
          await call(env, a.token, 'kb_propose', {
            kind: 'create',
            title: 'One more',
            content: 'c',
          })
        ).payload,
      ).toEqual({ untrusted: true, error: 'quota', message: KB_QUOTA_PROPOSER_REASON });
    });

    it("kb_my_proposals lists only the caller's own, without content", async () => {
      const a = await kbWorkspace();
      const b = h.launch({ kb: true });
      await call(env, a.token, 'kb_propose', {
        kind: 'create',
        title: 'Mine',
        content: 'my secret body',
      });
      await call(env, b.token!, 'kb_propose', {
        kind: 'create',
        title: 'Theirs',
        content: 'their body',
      });

      const mine = await call(env, a.token, 'kb_my_proposals');
      const proposals = mine.payload.proposals as Array<Record<string, unknown>>;
      expect(proposals).toHaveLength(1);
      expect(proposals[0]).toMatchObject({ kind: 'create', state: 'pending', title: 'Mine' });
      expect(Object.keys(proposals[0])).not.toContain('content');
      expect(Object.keys(proposals[0])).not.toContain('proposer');
      expect(mine.text).not.toContain('my secret body');
      expect(mine.text).not.toContain('Theirs');

      const theirs = await call(env, b.token!, 'kb_my_proposals', { state: 'pending' });
      expect((theirs.payload.proposals as Array<{ title: string }>).map((p) => p.title)).toEqual([
        'Theirs',
      ]);
      expect((await call(env, b.token!, 'kb_my_proposals', { state: 'approved' })).payload).toEqual(
        {
          untrusted: true,
          proposals: [],
        },
      );
    });

    it('a removal racing an in-flight kb_propose leaves a pending proposal the TTL expires', async () => {
      const alpha = await kbWorkspace('alpha');
      const realRead = env.store.readSettings.bind(env.store);
      let release: () => void = () => {};
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      vi.spyOn(env.store, 'readSettings').mockImplementationOnce(async (ws) => {
        await gate;
        return realRead(ws);
      });
      const inFlight = call(env, alpha.token, 'kb_propose', {
        kind: 'create',
        title: 'Late',
        content: 'c',
      });
      await new Promise((resolve) => setTimeout(resolve, 20));

      // The operator removes the Workspace while the call is past authentication.
      h.send({ type: 'removeWorkspace', id: alpha.ws.id }, h.ctx({ kb: env.kb }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      release();
      const late = await inFlight;
      expect(late.payload.state).toBe('pending');

      // Recorded behaviour: still pending, and the TTL expires it.
      env.clock.now += KB_PENDING_TTL_MS + 60_000;
      await submitCreate(env.store, 'Trigger', 'x', proposer(901), alpha.ws.id);
      const after = await env.store.listProposals(alpha.ws.id);
      if (!after.ok) throw new Error('list failed');
      expect(after.proposals.find((p) => p.id === late.payload.proposalId)?.state).toBe('expired');
    });
  });

  // ── Nothing leaks (acceptance 10) ───────────────────────────

  it('never puts a token, its digest, HOME or proposal text in replies or console output', async () => {
    const lines: string[] = [];
    for (const level of ['log', 'warn', 'error', 'info', 'debug'] as const) {
      vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
        lines.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
      });
    }
    const a = await kbWorkspace(undefined, { title: 'Entry title', content: 'Entry body' });
    const other = h.launch({ kb: true });
    const designed: string[] = [];
    const replies: string[] = [];
    const record = (raw: string) => replies.push(raw);

    record((await request(env, a.token, 'initialize', { protocolVersion: '2025-06-18' })).raw);
    record(
      (await post(env, a.token, { jsonrpc: '2.0', method: 'notifications/initialized' })).body,
    );
    record((await request(env, a.token, 'tools/list')).raw);
    record((await request(env, a.token, 'nope/secret-method-name')).raw);
    record((await post(env, a.token, '{oops')).body);
    record((await post(env, undefined, { jsonrpc: '2.0', id: 1, method: 'ping' })).body);
    record((await post(env, `${a.token}x`, { jsonrpc: '2.0', id: 1, method: 'ping' })).body);
    record((await call(env, a.token, 'kb_list')).raw);
    designed.push((await call(env, a.token, 'kb_read', { id: a.entryId })).raw);
    record(
      (
        await call(env, a.token, 'kb_propose', {
          kind: 'create',
          title: 'Secret title',
          content: 'Secret body',
        })
      ).raw,
    );
    record(
      (
        await call(env, a.token, 'kb_propose', {
          kind: 'create',
          title: 'Secret title',
          content: 'Secret body',
        })
      ).raw,
    );
    record(
      (
        await call(env, a.token, 'kb_propose', {
          kind: 'create',
          title: 'x\u0000',
          content: 'Secret body',
        })
      ).raw,
    );
    designed.push((await call(env, a.token, 'kb_my_proposals')).raw);
    record((await call(env, other.token!, 'kb_my_proposals')).raw);

    const haystack = [...replies, ...lines].join('\n');
    for (const token of [a.token, other.token!]) {
      expect(haystack).not.toContain(token.slice('pxa_kb_'.length));
      expect(haystack).not.toContain(crypto.createHash('sha256').update(token).digest('hex'));
      expect(designed.join('\n')).not.toContain(token.slice('pxa_kb_'.length));
    }
    expect(haystack).not.toContain(h.tempHome);
    expect(haystack).not.toContain('Secret title');
    expect(haystack).not.toContain('Secret body');
    expect(lines.join('\n')).not.toContain('Entry body');
    expect(lines.join('\n')).not.toContain('secret-method-name');
    const mcpLines = lines.filter((line) => line.includes('KB MCP'));
    expect(mcpLines.length).toBeGreaterThan(0);
    // The request log line (Fastify's logger) carries no header at all.
    const logged = JSON.stringify(
      serializeRequestForLog({
        method: 'POST',
        url: '/mcp',
        hostname: '127.0.0.1',
        ip: '127.0.0.1',
        socket: { remotePort: 5 },
        headers: { authorization: `Bearer ${a.token}` },
      } as unknown as Parameters<typeof serializeRequestForLog>[0]),
    );
    expect(logged).not.toContain('Bearer');
    expect(logged).not.toContain(a.token);
    for (const line of mcpLines) {
      expect(line).toMatch(
        /^\[Pixel Agents\] KB MCP: (initialize|ping|tools\/list|tools\/call|notifications\/initialized|notifications\/cancelled|unknown) -> -?\d+$/,
      );
    }
  });
});
