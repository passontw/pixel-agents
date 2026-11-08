import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import Fastify from 'fastify';

import type { AgentRuntime } from './agentRuntime.js';
import type { AgentStateStore } from './agentStateStore.js';
import type { CapabilityClaims, CapabilityRegistry } from './capabilities.js';
import type {
  AssetCache,
  ReloadAssetsSideEffect,
  SetHooksEnabledSideEffect,
} from './clientMessageHandler.js';
import { handleClientMessage } from './clientMessageHandler.js';
import {
  HOOK_API_PREFIX,
  KB_MCP_BAD_REQUEST_BODY,
  KB_MCP_BODY_LIMIT,
  KB_MCP_FORBIDDEN_BODY,
  KB_MCP_METHOD_NOT_ALLOWED_BODY,
  KB_MCP_METHODS,
  KB_MCP_NOT_FOUND_BODY,
  KB_MCP_OAUTH_PATHS,
  KB_MCP_PATH,
  KB_MCP_TOO_LARGE_BODY,
  KB_MCP_UNAUTHORIZED_BODY,
  KB_MCP_UNSUPPORTED_MEDIA_BODY,
  MAX_HOOK_BODY_SIZE,
  WS_CLOSE_FORBIDDEN_ORIGIN,
  WS_CLOSE_UNAUTHORIZED,
} from './constants.js';
import type { CuratorTable } from './curators.js';
import { KbMcpEndpoint, mcpRequestForbidden } from './kbMcp.js';
import type { KbRuntime } from './kbRuntime.js';
import type { PtySessionManager } from './terminal/ptySessionManager.js';
import { registerTerminalRoutes } from './terminal/terminalRoutes.js';
import type { AgentState } from './types.js';
import {
  bearerTokenValid,
  isAllowedWebSocketOrigin,
  privilegedHostnames,
  redactTokenQuery,
  standaloneHandshakeVerdict,
} from './wsAuth.js';

/** Options for creating the HTTP + WebSocket server. */
export interface HttpServerOptions {
  /** true = VS Code embedded mode (ephemeral port, no static, quiet logging) */
  embedded: boolean;
  /** Host to bind to. Default: '127.0.0.1' */
  host?: string;
  /** Port to listen on. Default: 0 (auto-assign) */
  port?: number;
  /** Bearer auth token for hook and WebSocket endpoints */
  token: string;
  /** AgentStateStore for WebSocket broadcast piping */
  store: AgentStateStore;
  /** Shared agent lifecycle core (for toggle side effects + standalone restore). Optional in embedded mode. */
  runtime?: AgentRuntime;
  /** Path to SPA dist directory for static serving (standalone only) */
  staticDir?: string;
  /** Cached assets loaded at startup (standalone only) */
  assetCache?: AssetCache;
  /** Callback when a hook event is received */
  onHookEvent?: (providerId: string, event: Record<string, unknown>) => void;
  /** Invoked when setHooksEnabled is toggled via WebSocket. Standalone installs/uninstalls hooks here. */
  onSetHooksEnabled?: SetHooksEnabledSideEffect;
  /** Invoked when an external asset directory is added/removed. Standalone reloads + re-broadcasts assets here. */
  onReloadAssets?: ReloadAssetsSideEffect;
  /** PTY terminals for standalone-launched agents. Absent = terminal feature off
   *  (VS Code embedded mode, where the editor owns terminals). */
  ptyManager?: PtySessionManager;
  /** Per-agent capabilities and Workspace curators (standalone, in memory). */
  capabilities?: CapabilityRegistry;
  curators?: CuratorTable;
  /** Extra Host names (beyond loopback and a specific bind address) a
   *  privileged standalone handshake may arrive under -- e.g. a reverse proxy's
   *  public name. See wsAuth.privilegedHostnames. */
  allowedHosts?: readonly string[];
  /** The Knowledge Base host (standalone only). With a capability registry it
   *  also enables POST /mcp. */
  kb?: KbRuntime;
  /** Whether a launch into a Workspace gets a capability (kb.isKbEnabled).
   *  Handed to every client message context. */
  isKbEnabled?: (workspaceId: string) => boolean;
  /** Tests only: the /mcp endpoint to serve (otherwise built from kb). */
  mcpEndpoint?: KbMcpEndpoint;
}

declare module 'fastify' {
  interface FastifyRequest {
    /** The verified capability of an /mcp request, set by the root onRequest
     *  guard; null on every other request. */
    kbMcpClaims: CapabilityClaims | null;
  }
}

/** Result of createHttpServer(). */
export interface HttpServerHandle {
  app: FastifyInstance;
  port: number;
}

const startTime = Date.now();

/**
 * Create a Fastify server with hook endpoint, health check, and WebSocket support.
 *
 * All Fastify-specific code lives in this file. The rest of the server layer is
 * framework-agnostic. If Fastify is ever replaced, only this file changes.
 */
export async function createHttpServer(options: HttpServerOptions): Promise<HttpServerHandle> {
  const app = Fastify({
    // Standalone logs every request. The privilege token rides `/ws?token=`
    // and `/terminal/:id?token=` handshakes, so the url is redacted before it
    // is written -- otherwise every (re)connect would put the secret in stdout
    // and any log file (see wsAuth.redactTokenQuery).
    logger: options.embedded ? false : { serializers: { req: serializeRequestForLog } },
    bodyLimit: MAX_HOOK_BODY_SIZE,
  });

  // The /mcp guard is a ROOT onRequest hook added before CORS, so it runs
  // before @fastify/cors can answer a preflight or add a header.
  const mcp = mcpEndpointFor(options);
  if (mcp) registerMcpGuard(app, mcp);

  await app.register(fastifyCors, { origin: true });
  await app.register(fastifyWebsocket);

  // Static SPA serving (standalone mode only)
  if (!options.embedded && options.staticDir) {
    await app.register(fastifyStatic, {
      root: options.staticDir,
      prefix: '/',
    });
    // HTML5 history fallback: serve index.html for unmatched routes
    app.setNotFoundHandler((_req, reply) => {
      reply.sendFile('index.html');
    });
  }

  // ── Routes ──────────────────────────────────────────────────

  const host = options.host ?? '127.0.0.1';
  const allowedHostnames = privilegedHostnames(host, options.allowedHosts ?? []);

  registerHealthRoute(app);
  registerHookRoute(app, options);
  registerWebSocketRoute(app, options, allowedHostnames);
  registerTerminalRoutes(app, {
    token: options.token,
    allowedHostnames,
    ptyManager: options.ptyManager,
  });
  if (mcp) await registerMcpRoutes(app, mcp);

  // ── Listen ──────────────────────────────────────────────────

  await app.listen({ host, port: options.port ?? 0 });
  const address = app.server.address();
  const port = typeof address === 'object' ? (address?.port ?? 0) : 0;

  return { app, port };
}

// ── Health ──────────────────────────────────────────────────────

function registerHealthRoute(app: FastifyInstance): void {
  app.get('/api/health', async () => ({
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    pid: process.pid,
  }));
}

// ── Hook Events ────────────────────────────────────────────────

function registerHookRoute(app: FastifyInstance, options: HttpServerOptions): void {
  app.post<{
    Params: { providerId: string };
    Body: Record<string, unknown>;
  }>(
    `${HOOK_API_PREFIX}/:providerId`,
    {
      preHandler: bearerAuth(options.token),
      schema: {
        params: {
          type: 'object',
          properties: {
            providerId: { type: 'string', pattern: '^[a-z0-9-]+$' },
          },
          required: ['providerId'],
        },
      },
    },
    async (request, reply) => {
      const { providerId } = request.params;
      const event = request.body;

      if (event.session_id && event.hook_event_name) {
        options.onHookEvent?.(providerId, event);
      }

      reply.send('ok');
    },
  );
}

// ── WebSocket ──────────────────────────────────────────────────

function registerWebSocketRoute(
  app: FastifyInstance,
  options: HttpServerOptions,
  allowedHostnames: ReadonlySet<string>,
): void {
  app.get('/ws', { websocket: true }, (socket, request) => {
    // CONNECTION gate. Embedded (VS Code) requires the Bearer token. Standalone
    // requires a same-origin handshake instead (isAllowedWebSocketOrigin), so a
    // non-browser local client with no Origin can still watch the office. What
    // may be DONE over an accepted connection is a separate question, decided
    // below.
    if (options.embedded) {
      if (!bearerTokenValid(request.headers.authorization, options.token)) {
        socket.close(WS_CLOSE_UNAUTHORIZED, 'unauthorized');
        return;
      }
    } else if (!isAllowedWebSocketOrigin(request.headers.origin, request.headers.host)) {
      socket.close(WS_CLOSE_FORBIDDEN_ORIGIN, 'forbidden origin');
      return;
    }

    // Both modes prove privilege with the SAME out-of-band secret, differently
    // carried: embedded sends the Bearer token it was handed in-process;
    // standalone sends the `?token=` the CLI printed in the local URL and the
    // SPA forwarded on this handshake, and it must arrive under an allowed Host
    // -- the same verdict the terminal socket applies. A network POSITION
    // never grants privilege, because every position is reproducible by a
    // forwarder; the Host allowlist can only take it away.
    let privileged = options.embedded;
    if (!options.embedded) {
      const verdict = standaloneHandshakeVerdict(
        request.url,
        request.headers.host,
        options.token,
        allowedHostnames,
      );
      privileged = verdict === 'privileged';
      if (verdict === 'untrusted-host') {
        // The operator has the right URL but reached us under a name they never
        // listed (typically a reverse proxy). Say how to fix it, or the session
        // silently stays watch-only.
        console.warn(
          `[Pixel Agents] Tokened connection via Host "${request.headers.host ?? ''}" is read-only: restart with --allowed-host <that name> to allow changes from it.`,
        );
      }
    }

    const { store } = options;

    // Pipe store events to WebSocket client
    const onAgentAdded = (id: number, agent: AgentState) => {
      safeSend(socket, {
        type: 'agentCreated',
        id,
        directoryName: agent.directoryName,
        isExternal: agent.isExternal || undefined,
        isTeammate: agent.leadAgentId !== undefined || undefined,
        teammateName: agent.agentName,
        parentAgentId: agent.leadAgentId,
        teamName: agent.teamName,
        hooksOnly: agent.hooksOnly || undefined,
        palette: agent.palette,
        hueShift: agent.hueShift,
        workspaceId: agent.workspaceId,
        roleName: agent.roleName,
      });
    };

    const onAgentRemoved = (id: number) => {
      safeSend(socket, { type: 'agentClosed', id });
    };

    const onBroadcast = (message: Record<string, unknown>) => {
      safeSend(socket, message);
    };

    store.on('agentAdded', onAgentAdded);
    store.on('agentRemoved', onAgentRemoved);
    store.on('broadcast', onBroadcast);

    // Handle incoming client messages
    socket.on('message', (data: Buffer | string) => {
      try {
        const msg = JSON.parse(data.toString()) as Record<string, unknown>;
        if (!options.embedded && msg.type) {
          console.log('[Pixel Agents] WS client message:', msg.type);
        }
        handleClientMessage(msg, (m) => safeSend(socket, m), {
          store,
          runtime: options.runtime,
          cache: options.assetCache ?? null,
          onSetHooksEnabled: options.onSetHooksEnabled,
          onReloadAssets: options.onReloadAssets,
          privileged,
          ptyManager: options.ptyManager,
          capabilities: options.capabilities,
          curators: options.curators,
          isKbEnabled: options.isKbEnabled,
          kb: options.kb,
        });
      } catch {
        // Malformed JSON, ignore
      }
    });

    socket.on('close', () => {
      store.off('agentAdded', onAgentAdded);
      store.off('agentRemoved', onAgentRemoved);
      store.off('broadcast', onBroadcast);
    });
  });
}

// ── Knowledge Base MCP ─────────────────────────────────────────

/** Standalone with a KB host and a capability registry; never embedded. */
function mcpEndpointFor(options: HttpServerOptions): KbMcpEndpoint | undefined {
  if (options.embedded) return undefined;
  if (options.mcpEndpoint) return options.mcpEndpoint;
  if (!options.kb || !options.capabilities) return undefined;
  return new KbMcpEndpoint({
    capabilities: options.capabilities,
    store: options.kb.store,
    instance: options.kb.instance,
    version: process.env.PIXEL_AGENTS_VERSION,
  });
}

function isMcpRoute(url: string | undefined): boolean {
  return url === KB_MCP_PATH || url === `${KB_MCP_PATH}/*`;
}

/**
 * The root onRequest guard. Decided on the ROUTE the router matched
 * (routeOptions.url), never on request.url, so `/%6Dcp` and an absolute-form
 * target reach it exactly like `/mcp`. Headers only: a refused request's body
 * is never read. 403 for the network checks (defence in depth), then 401
 * unless the Authorization header carries a live capability -- for every
 * message, initialize and notifications included.
 */
function registerMcpGuard(app: FastifyInstance, mcp: KbMcpEndpoint): void {
  app.decorateRequest('kbMcpClaims', null);
  app.addHook('onRequest', async (request, reply) => {
    if (!isMcpRoute(request.routeOptions.url)) return;
    if (
      mcpRequestForbidden({
        rawHeaders: request.raw.rawHeaders,
        remoteAddress: request.socket.remoteAddress,
      })
    ) {
      return reply.code(403).send(KB_MCP_FORBIDDEN_BODY);
    }
    const claims = mcp.authenticate(request.raw.rawHeaders);
    if (!claims) return reply.code(401).send(KB_MCP_UNAUTHORIZED_BODY);
    request.kbMcpClaims = claims;
  });
}

/** The content type of a request, without parameters, lower-cased. */
function mediaType(request: FastifyRequest): string {
  return (request.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
}

/**
 * POST /mcp and its neighbours, in their own encapsulated scope so the JSON
 * parser, the 256 KiB body limit and the error replies here change nothing for
 * /api/hooks or any other route. Every method is registered, so neither the
 * static GET /* nor the CORS OPTIONS * can answer for /mcp; `cors: false`
 * keeps @fastify/cors off these routes entirely.
 */
async function registerMcpRoutes(app: FastifyInstance, mcp: KbMcpEndpoint): Promise<void> {
  await app.register(async (scope) => {
    scope.removeContentTypeParser('application/json');
    scope.addContentTypeParser('application/json', { parseAs: 'string' }, (_request, body, done) =>
      done(null, mcp.parseBody(body as string)),
    );
    // Fixed replies only: a framework error message can quote the input.
    scope.setErrorHandler((error: { statusCode?: number }, _request, reply) => {
      if (error.statusCode === 413) return reply.code(413).send(KB_MCP_TOO_LARGE_BODY);
      if (error.statusCode === 415) return reply.code(415).send(KB_MCP_UNSUPPORTED_MEDIA_BODY);
      return reply.code(400).send(KB_MCP_BAD_REQUEST_BODY);
    });
    // After the guard, before any body is read.
    scope.addHook('preParsing', async (request, reply) => {
      if (!isMcpRoute(request.routeOptions.url)) return;
      if (request.routeOptions.url !== KB_MCP_PATH) {
        return reply.code(404).send(KB_MCP_NOT_FOUND_BODY);
      }
      if (request.method !== 'POST') {
        return reply.code(405).header('Allow', 'POST').send(KB_MCP_METHOD_NOT_ALLOWED_BODY);
      }
      if (mediaType(request) !== 'application/json') {
        return reply.code(415).send(KB_MCP_UNSUPPORTED_MEDIA_BODY);
      }
    });

    const config = { cors: false };
    scope.route({
      method: [...KB_MCP_METHODS],
      url: KB_MCP_PATH,
      bodyLimit: KB_MCP_BODY_LIMIT,
      config,
      handler: async (request, reply) => {
        const claims = request.kbMcpClaims;
        // Unreachable past the guard; refused rather than assumed.
        if (!claims) return reply.code(401).send(KB_MCP_UNAUTHORIZED_BODY);
        const result = await mcp.handle(claims, request.body);
        if (result.body === undefined) return reply.code(result.status).send();
        return reply.code(result.status).type('application/json').send(result.body);
      },
    });
    scope.route({
      method: [...KB_MCP_METHODS],
      url: `${KB_MCP_PATH}/*`,
      config,
      handler: async (_request, reply) => reply.code(404).send(KB_MCP_NOT_FOUND_BODY),
    });
    // An MCP client that got a 401 may look for OAuth here; it must find
    // nothing, not the SPA's index.html. Answered before any body is read.
    for (const url of KB_MCP_OAUTH_PATHS) {
      scope.route({
        method: [...KB_MCP_METHODS],
        url,
        config,
        onRequest: async (_request, reply) => reply.code(404).send(KB_MCP_NOT_FOUND_BODY),
        handler: async (_request, reply) => reply.code(404).send(KB_MCP_NOT_FOUND_BODY),
      });
    }
  });
}

// ── Auth Helper ────────────────────────────────────────────────

function bearerAuth(expectedToken: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!bearerTokenValid(request.headers.authorization, expectedToken)) {
      reply.code(401).send('unauthorized');
    }
  };
}

// ── Logging ────────────────────────────────────────────────────

/** Fastify's default request serializer, minus the token query. Exported so a
 *  test can pin that the secret never reaches the log line. */
export function serializeRequestForLog(request: FastifyRequest): Record<string, unknown> {
  return {
    method: request.method,
    url: redactTokenQuery(request.url),
    hostname: request.hostname,
    remoteAddress: request.ip,
    remotePort: request.socket.remotePort,
  };
}

// ── Utilities ──────────────────────────────────────────────────

function safeSend(
  socket: { send: (data: string) => void; readyState: number },
  message: Record<string, unknown>,
): void {
  // WebSocket.OPEN = 1
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(message));
  }
}
