import type { FastifyInstance, InjectOptions } from 'fastify';
import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';

import { DEFAULT_WORKSPACE_ID } from '../../core/src/constants.js';
import { AgentStateStore } from '../src/agentStateStore.js';
import { CapabilityRegistry } from '../src/capabilities.js';
import { MAX_HOOK_BODY_SIZE } from '../src/constants.js';
import { createHttpServer, type HttpServerOptions } from '../src/httpServer.js';
import { KbPaths } from '../src/kbFiles.js';
import { KbMcpEndpoint } from '../src/kbMcp.js';
import { KbRuntime } from '../src/kbRuntime.js';
import { PtySessionManager } from '../src/terminal/ptySessionManager.js';
import { KbHarness } from './curatorHarness.js';
import { singleStore } from './kbHarness.js';

/**
 * The /mcp guard and authentication (S3b acceptance 3 and 4): who is refused
 * before any handler or body parsing runs, that the router's match (not the
 * raw url) decides what is guarded, and that nothing else on the server --
 * CORS, body limits, /api/hooks parsing, /ws, /terminal -- changed.
 */

const SERVER_TOKEN = '55555555-5555-4555-8555-555555555555';
const PING = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' });

interface Server {
  app: FastifyInstance;
  port: number;
  mcp: KbMcpEndpoint;
  hookEvents: Array<Record<string, unknown>>;
}

function staticDirIn(home: string): string {
  const dir = path.join(home, 'spa');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), '<html>SPA</html>');
  return dir;
}

async function startServer(
  h: KbHarness,
  overrides: Partial<HttpServerOptions> = {},
): Promise<Server> {
  const paths = new KbPaths(path.join(h.tempHome, '.pixel-agents', 'kb'));
  const store = singleStore(paths);
  await store.writeSettings(DEFAULT_WORKSPACE_ID, { kbEnabled: true });
  const kb = new KbRuntime({ bindHost: '127.0.0.1', paths, store });
  const mcp = new KbMcpEndpoint({
    capabilities: h.capabilities,
    store,
    instance: kb.instance,
    log: () => {},
  });
  const hookEvents: Array<Record<string, unknown>> = [];
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
    staticDir: staticDirIn(h.tempHome),
    onHookEvent: (_provider, event) => hookEvents.push(event),
    kb,
    isKbEnabled: kb.isKbEnabled,
    mcpEndpoint: mcp,
    ...overrides,
  });
  kb.serverListening(port);
  return { app, port, mcp, hookEvents };
}

/** One raw HTTP/1.1 exchange on loopback; returns the status line and body. */
function rawRequest(
  port: number,
  text: string,
): Promise<{ status: number; body: string; head: string }> {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1', () => socket.write(text));
    let data = '';
    socket.on('data', (chunk) => {
      data += chunk.toString();
    });
    socket.on('error', reject);
    socket.on('close', () => {
      const [head, ...rest] = data.split('\r\n\r\n');
      resolve({ status: Number(head.split(' ')[1]), body: rest.join('\r\n\r\n'), head });
    });
  });
}

function hasAccessControlHeader(headers: Record<string, unknown>): boolean {
  return Object.keys(headers).some((name) => name.toLowerCase().startsWith('access-control-'));
}

describe('/mcp guard and authentication', () => {
  let h: KbHarness;
  let server: Server;
  let token: string;
  let authenticate: ReturnType<typeof vi.spyOn>;
  let handle: ReturnType<typeof vi.spyOn>;
  let parseBody: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    h = new KbHarness();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    server = await startServer(h);
    token = h.launch({ kb: true }).token!;
    authenticate = vi.spyOn(server.mcp, 'authenticate');
    handle = vi.spyOn(server.mcp, 'handle');
    parseBody = vi.spyOn(server.mcp, 'parseBody');
  });

  afterEach(async () => {
    await server.app.close();
    vi.restoreAllMocks();
    h.dispose();
  });

  const post = (
    authorization: string | undefined,
    extra: Record<string, string> = {},
    payload = PING,
  ) =>
    server.app.inject({
      method: 'POST',
      url: '/mcp',
      headers: {
        'content-type': 'application/json',
        ...(authorization === undefined ? {} : { authorization }),
        ...extra,
      },
      payload,
    });

  it('serves an authenticated ping (the positive control)', async () => {
    const res = await post(`Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ jsonrpc: '2.0', id: 1, result: {} });
  });

  // ── Authentication (acceptance 3) ───────────────────────────

  it('answers 401 with a fixed body to every invalid credential', async () => {
    const foreign = new CapabilityRegistry({
      store: new AgentStateStore(),
      ptyManager: PtySessionManager.disabled('test'),
    }).issue({ agentId: 1, sessionId: 's', workspaceId: undefined }).token;
    const revoked = h.launch({ kb: true });
    h.send({ type: 'closeAgent', id: revoked.id });

    for (const authorization of [
      undefined,
      '',
      'Bearer',
      'Bearer ',
      `Bearer  ${token}`,
      `Bearer ${token} `,
      `bearer ${token}`,
      `BEARER ${token}`,
      `Basic ${token}`,
      token,
      'Bearer ${PIXEL_AGENTS_CAP_0A1B2C3D}',
      `Bearer ${foreign}`,
      `Bearer ${revoked.token}`,
      `Bearer ${SERVER_TOKEN}`,
      SERVER_TOKEN,
    ]) {
      const res = await post(authorization);
      expect(res.statusCode).toBe(401);
      expect(res.json()).toEqual({ error: 'unauthorized' });
      expect(res.headers['www-authenticate']).toBeUndefined();
    }
    const query = await server.app.inject({
      method: 'POST',
      url: `/mcp?token=${SERVER_TOKEN}`,
      headers: { 'content-type': 'application/json' },
      payload: PING,
    });
    expect(query.statusCode).toBe(401);
    const capQuery = await server.app.inject({
      method: 'POST',
      url: `/mcp?token=${token}`,
      headers: { 'content-type': 'application/json' },
      payload: PING,
    });
    expect(capQuery.statusCode).toBe(401);
    expect(handle).not.toHaveBeenCalled();
  });

  it('refuses two Authorization headers even when one is valid', async () => {
    const res = await rawRequest(
      server.port,
      `POST /mcp HTTP/1.1\r\nHost: 127.0.0.1\r\nAuthorization: Bearer ${token}\r\nAuthorization: Bearer ${token}\r\nContent-Type: application/json\r\nContent-Length: ${PING.length}\r\nConnection: close\r\n\r\n${PING}`,
    );
    expect(res.status).toBe(401);
  });

  it('authenticates notifications and initialize too (401, never 202)', async () => {
    for (const payload of [
      JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
    ]) {
      const res = await post(undefined, {}, payload);
      expect(res.statusCode).toBe(401);
    }
    expect(handle).not.toHaveBeenCalled();
  });

  it('never parses an unauthenticated body, however large', async () => {
    const huge = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'ping',
      pad: 'x'.repeat(300 * 1024),
    });
    const res = await post(undefined, {}, huge);
    expect(res.statusCode).toBe(401);
    expect(parseBody).not.toHaveBeenCalled();
    expect(handle).not.toHaveBeenCalled();
  });

  it('gives a capability no privilege on /api/hooks, /ws or /terminal', async () => {
    const hook = await server.app.inject({
      method: 'POST',
      url: '/api/hooks/claude',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: { session_id: 's', hook_event_name: 'Stop' },
    });
    expect(hook.statusCode).toBe(401);
    expect(server.hookEvents).toEqual([]);

    const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws?token=${token}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const access = await new Promise<unknown>((resolve, reject) => {
      ws.on('open', () => ws.send(JSON.stringify({ type: 'webviewReady' })));
      ws.on('message', (data: Buffer) => {
        const msg = JSON.parse(data.toString()) as { type: string };
        if (msg.type === 'officeAccess') resolve(msg);
      });
      ws.on('error', reject);
    });
    expect(access).toEqual({ type: 'officeAccess', readOnly: true });
    ws.close();

    const terminal = new WebSocket(`ws://127.0.0.1:${server.port}/terminal/1?token=${token}`);
    const closeCode = await new Promise<number>((resolve) => {
      terminal.on('close', (code: number) => resolve(code));
      terminal.on('error', () => {});
    });
    expect(closeCode).not.toBe(1000);
  });

  // ── Guard (acceptance 4) ────────────────────────────────────

  it('refuses any Origin with 403 and no CORS headers, preflight included', async () => {
    for (const origin of ['http://evil.example', 'http://127.0.0.1:3000', 'null']) {
      const res = await post(`Bearer ${token}`, { origin });
      expect(res.statusCode).toBe(403);
      expect(res.json()).toEqual({ error: 'forbidden' });
      expect(hasAccessControlHeader(res.headers)).toBe(false);
      const preflight = await server.app.inject({
        method: 'OPTIONS',
        url: '/mcp',
        headers: {
          origin,
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'authorization,content-type',
        },
      });
      expect(preflight.statusCode).toBe(403);
      expect(hasAccessControlHeader(preflight.headers)).toBe(false);
    }
    // An empty Origin is still an Origin (raw, since inject may drop it).
    const empty = await rawRequest(
      server.port,
      `POST /mcp HTTP/1.1\r\nHost: 127.0.0.1\r\nOrigin: \r\nAuthorization: Bearer ${token}\r\nContent-Type: application/json\r\nContent-Length: ${PING.length}\r\nConnection: close\r\n\r\n${PING}`,
    );
    expect(empty.status).toBe(403);
    expect(empty.head.toLowerCase()).not.toContain('access-control-');
    expect(authenticate).not.toHaveBeenCalled();
    expect(handle).not.toHaveBeenCalled();
  });

  it('guards every spelling the router matches to /mcp, before authentication', async () => {
    for (const url of ['/%6Dcp', '/%6dcp', '/mcp/', '/mcp/x', '/mcp/x/y']) {
      const res = await server.app.inject({
        method: 'POST',
        url,
        headers: { origin: 'http://evil.example', authorization: `Bearer ${token}` },
        payload: PING,
      });
      expect(res.statusCode).toBe(403);
    }
    const absolute = await rawRequest(
      server.port,
      `POST http://x/mcp HTTP/1.1\r\nHost: 127.0.0.1\r\nOrigin: http://evil.example\r\nAuthorization: Bearer ${token}\r\nContent-Type: application/json\r\nContent-Length: ${PING.length}\r\nConnection: close\r\n\r\n${PING}`,
    );
    expect(absolute.status).toBe(403);
    expect(authenticate).not.toHaveBeenCalled();
    expect(handle).not.toHaveBeenCalled();

    // Without the Origin they are authenticated like /mcp: the encoded and
    // absolute forms ARE /mcp, the sub-paths are 404 after authentication.
    expect((await post(undefined, {}, PING)).statusCode).toBe(401);
    const encoded = await server.app.inject({
      method: 'POST',
      url: '/%6Dcp',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: PING,
    });
    expect(encoded.statusCode).toBe(200);
    const absoluteOk = await rawRequest(
      server.port,
      `POST http://x/mcp HTTP/1.1\r\nHost: 127.0.0.1\r\nAuthorization: Bearer ${token}\r\nContent-Type: application/json\r\nContent-Length: ${PING.length}\r\nConnection: close\r\n\r\n${PING}`,
    );
    expect(absoluteOk.status).toBe(200);
    for (const url of ['/mcp/', '/mcp/x']) {
      const unauthenticated = await server.app.inject({ method: 'POST', url, payload: PING });
      expect(unauthenticated.statusCode).toBe(401);
      const sub = await server.app.inject({
        method: 'POST',
        url,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: PING,
      });
      expect(sub.statusCode).toBe(404);
      expect(sub.json()).toEqual({ error: 'not_found' });
    }
  });

  it('answers GET /mcp 405 (or 401), never the SPA', async () => {
    const spa = await server.app.inject({ method: 'GET', url: '/some/page' });
    expect(spa.body).toBe('<html>SPA</html>');
    const get = await server.app.inject({
      method: 'GET',
      url: '/mcp',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(get.statusCode).toBe(405);
    expect(get.body).not.toContain('SPA');
    const anonymous = await server.app.inject({ method: 'GET', url: '/mcp' });
    expect(anonymous.statusCode).toBe(401);
    expect(anonymous.body).not.toContain('SPA');
  });

  it('refuses a non-loopback or duplicated Host, forwarding headers and a remote peer', async () => {
    for (const host of [
      'evil.example',
      'evil.example:80',
      '192.168.1.5:3100',
      '127.0.0.1.nip.io',
    ]) {
      expect((await post(`Bearer ${token}`, { host })).statusCode).toBe(403);
    }
    for (const host of ['127.0.0.1:1234', 'localhost', '[::1]:9']) {
      expect((await post(`Bearer ${token}`, { host })).statusCode).toBe(200);
    }
    authenticate.mockClear();
    const forwarding: Array<Record<string, string>> = [
      { forwarded: 'for=10.0.0.1' },
      { 'x-forwarded-for': '10.0.0.1' },
      { 'x-forwarded-host': 'evil.example' },
      { via: '1.1 proxy' },
    ];
    for (const header of forwarding) {
      expect((await post(`Bearer ${token}`, header)).statusCode).toBe(403);
    }
    const twoHosts = await rawRequest(
      server.port,
      `POST /mcp HTTP/1.1\r\nHost: 127.0.0.1\r\nHost: evil.example\r\nAuthorization: Bearer ${token}\r\nContent-Type: application/json\r\nContent-Length: ${PING.length}\r\nConnection: close\r\n\r\n${PING}`,
    );
    expect(twoHosts.status).toBe(403);
    for (const remoteAddress of ['10.0.0.5', '192.168.1.2', '::ffff:10.0.0.5', '2001:db8::1']) {
      const res = await server.app.inject({
        method: 'POST',
        url: '/mcp',
        remoteAddress,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: PING,
      });
      expect(res.statusCode).toBe(403);
    }
    expect(authenticate).not.toHaveBeenCalled();
    for (const remoteAddress of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
      const res = await server.app.inject({
        method: 'POST',
        url: '/mcp',
        remoteAddress,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: PING,
      });
      expect(res.statusCode).toBe(200);
    }
  });

  it('answers OAuth discovery and registration with 404, not the SPA', async () => {
    for (const [method, url] of [
      ['GET', '/.well-known/oauth-authorization-server'],
      ['GET', '/.well-known/oauth-protected-resource/mcp'],
      ['GET', '/.well-known/openid-configuration'],
      ['POST', '/register'],
      ['GET', '/authorize'],
      ['POST', '/token'],
    ] as const) {
      const res = await server.app.inject({
        method,
        url,
        headers: { 'content-type': 'application/json' },
        payload: method === 'POST' ? '{}' : undefined,
      });
      expect(res.statusCode).toBe(404);
      expect(res.body).not.toContain('SPA');
    }
  });

  it('accepts a 200 KiB request and refuses one over 256 KiB with 413', async () => {
    const big = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'ping',
      params: { _meta: { pad: 'x'.repeat(200 * 1024) } },
    });
    expect((await post(`Bearer ${token}`, {}, big)).statusCode).toBe(200);
    const tooBig = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'ping',
      pad: 'x'.repeat(257 * 1024),
    });
    const res = await post(`Bearer ${token}`, {}, tooBig);
    expect(res.statusCode).toBe(413);
    expect(res.json()).toEqual({ error: 'payload_too_large' });
  });
});

describe('everything outside /mcp is unchanged', () => {
  let h: KbHarness;
  const servers: Server[] = [];

  beforeEach(() => {
    h = new KbHarness();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    for (const server of servers.splice(0)) await server.app.close();
    vi.restoreAllMocks();
    h.dispose();
  });

  /** The same request against a server with the KB and one without. */
  async function both(request: InjectOptions) {
    if (servers.length === 0) {
      servers.push(await startServer(h));
      servers.push(
        await startServer(h, { kb: undefined, isKbEnabled: undefined, mcpEndpoint: undefined }),
      );
    }
    const [withKb, without] = await Promise.all(servers.map((s) => s.app.inject(request)));
    return { withKb, without };
  }

  const shape = (res: { statusCode: number; headers: Record<string, unknown>; body: string }) => ({
    status: res.statusCode,
    body: res.body,
    acao: res.headers['access-control-allow-origin'],
    acam: res.headers['access-control-allow-methods'],
    vary: res.headers.vary,
  });

  it('keeps CORS, the 64 KiB limit and the JSON parsing of /api/hooks', async () => {
    const requests: Array<InjectOptions> = [
      { method: 'GET', url: '/api/health', headers: { origin: 'http://elsewhere.example' } },
      {
        method: 'OPTIONS',
        url: '/api/hooks/claude',
        headers: { origin: 'http://elsewhere.example', 'access-control-request-method': 'POST' },
      },
      {
        method: 'POST',
        url: '/api/hooks/claude',
        headers: { authorization: `Bearer ${SERVER_TOKEN}`, 'content-type': 'application/json' },
        payload: JSON.stringify({ session_id: 's1', hook_event_name: 'Stop' }),
      },
      {
        method: 'POST',
        url: '/api/hooks/claude',
        headers: { authorization: `Bearer ${SERVER_TOKEN}`, 'content-type': 'application/json' },
        payload: '{"session_id":',
      },
      {
        method: 'POST',
        url: '/api/hooks/claude',
        headers: { authorization: `Bearer ${SERVER_TOKEN}`, 'content-type': 'text/plain' },
        payload: 'x',
      },
      {
        method: 'POST',
        url: '/api/hooks/claude',
        headers: { authorization: `Bearer ${SERVER_TOKEN}`, 'content-type': 'application/json' },
        payload: JSON.stringify({ pad: 'x'.repeat(MAX_HOOK_BODY_SIZE) }),
      },
    ];
    for (const request of requests) {
      const { withKb, without } = await both(request);
      expect(shape(withKb)).toEqual(shape(without));
    }
    const oversized = await both(requests[5]);
    expect(oversized.withKb.statusCode).toBe(413);
    expect(servers[0].hookEvents).toEqual([{ session_id: 's1', hook_event_name: 'Stop' }]);
    expect(servers[1].hookEvents).toEqual([{ session_id: 's1', hook_event_name: 'Stop' }]);
    // No KB host: no /mcp route, just the SPA.
    const noMcp = await servers[1].app.inject({ method: 'POST', url: '/mcp', payload: PING });
    expect(noMcp.body).toBe('<html>SPA</html>');
  });

  it('registers no /mcp in embedded mode', async () => {
    const paths = new KbPaths(path.join(h.tempHome, 'kb'));
    const kb = new KbRuntime({ bindHost: '127.0.0.1', paths, store: singleStore(paths) });
    const embedded = await createHttpServer({
      embedded: true,
      host: '127.0.0.1',
      port: 0,
      token: SERVER_TOKEN,
      store: h.store,
      capabilities: h.capabilities,
      kb,
    });
    const res = await embedded.app.inject({ method: 'POST', url: '/mcp', payload: PING });
    expect(res.statusCode).toBe(404);
    expect(res.body).not.toContain('unauthorized');
    await embedded.app.close();
  });
});
