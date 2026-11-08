/**
 * The Knowledge Base as the standalone host runs it (S3b): one object cli.ts
 * builds and hands to the server, the launcher and the client messages.
 *
 * It owns the four launch-time facts a KB launch needs and answers them
 * synchronously (a launch is synchronous):
 *   (a)+(b) the Workspace's settings.json says kbEnabled, read with the same
 *           private-chain rules as KbStore.readSettings (kbFiles.ts);
 *   (c)     the server is bound to loopback;
 *   (d)     this process owns a listening server, so the MCP base URL is known;
 *   (e)     the host is not embedded (VS Code never gets a KB).
 * Any one false means isKbEnabled is false and a launch is exactly the pre-KB
 * one. The /mcp endpoint re-reads the settings on every request, so turning a
 * Workspace's KB off stops running agents too.
 *
 * `instance` is this server process's random id: it goes into every proposer
 * record, so proposals from two server lifetimes never share a proposer key.
 */

import * as crypto from 'crypto';

import { DEFAULT_WORKSPACE_ID } from '../../core/src/constants.js';
import { kbLog, KbPaths, readSettingsJsonSync } from './kbFiles.js';
import { type KbStore, kbStore, parseSettings } from './kbStore.js';
import { isLoopbackHost, normalizeHostname } from './wsAuth.js';

export interface KbRuntimeOptions {
  /** The address the server binds to (--host). */
  bindHost: string;
  /** VS Code embedded mode never has a KB. */
  embedded?: boolean;
  /** Tests only: a KB root other than ~/.pixel-agents/kb (and its store). */
  paths?: KbPaths;
  store?: KbStore;
  /** Tests only: a fixed instance id. */
  instance?: string;
}

/**
 * The base URL agents reach /mcp at for a server bound to `bindHost` and
 * listening on `port`, or undefined when the bind is not loopback. A
 * `localhost` bind is addressed as 127.0.0.1 (one name, no resolver involved).
 */
export function mcpBaseUrlFor(bindHost: string, port: number): string | undefined {
  if (!isLoopbackHost(bindHost)) return undefined;
  return normalizeHostname(bindHost) === '::1'
    ? `http://[::1]:${port}`
    : `http://127.0.0.1:${port}`;
}

/**
 * The Workspaces whose KB is on, for curatorsLoaded: the default first, then
 * `workspaceIds` in order, each once, kept only where `isKbEnabled` says yes.
 */
export function kbWorkspaceIdsFor(
  workspaceIds: readonly string[],
  isKbEnabled: (workspaceId: string) => boolean,
): string[] {
  const unique = [...new Set([DEFAULT_WORKSPACE_ID, ...workspaceIds])];
  return unique.filter((id) => isKbEnabled(id));
}

export class KbRuntime {
  readonly instance: string;
  readonly store: KbStore;
  private readonly paths: KbPaths;
  private readonly bindHost: string;
  private readonly embedded: boolean;
  private baseUrl: string | undefined;

  constructor(options: KbRuntimeOptions) {
    this.bindHost = options.bindHost;
    this.embedded = options.embedded ?? false;
    this.paths = options.paths ?? options.store?.paths ?? KbPaths.forHome();
    // The process's one store for this root: a second KbStore would take a
    // second writer lock on the same directory.
    this.store = options.store ?? kbStore();
    this.instance = options.instance ?? crypto.randomUUID();
  }

  /**
   * The server THIS process started is listening on `port`. Only then is there
   * an endpoint to give agents: a reused server (another process's) never calls
   * this, so its launches stay without a KB.
   */
  serverListening(port: number): void {
    if (this.embedded) return;
    this.baseUrl = mcpBaseUrlFor(this.bindHost, port);
  }

  /** Where launched agents reach /mcp, or undefined (no KB launch possible). */
  readonly mcpBaseUrl = (): string | undefined => this.baseUrl;

  /** Whether a launch into this (normalized) Workspace gets a capability and
   *  the MCP flags. Synchronous; any failure is false. */
  readonly isKbEnabled = (workspaceId: string): boolean => {
    if (this.embedded || this.baseUrl === undefined) return false;
    if (!isLoopbackHost(this.bindHost)) return false;
    const settings = parseSettings(readSettingsJsonSync(this.paths, workspaceId));
    return settings?.kbEnabled === true;
  };

  /** A Workspace was removed: void its waiting proposals. Never rejects; a
   *  failure is logged with a fixed line. */
  readonly voidWorkspaceProposals = async (workspaceId: string): Promise<void> => {
    try {
      const result = await this.store.voidWorkspaceProposals(workspaceId, 'workspace_removed');
      if (!result.ok) {
        kbLog("the removed Workspace's proposals could not be voided", { errno: result.code });
      }
    } catch {
      kbLog("the removed Workspace's proposals could not be voided");
    }
  };
}
