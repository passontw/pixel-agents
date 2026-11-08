/**
 * What a KB launch adds to the claude command line and environment (S3b).
 *
 * Only standaloneAgentLauncher calls this, and only after it issued a
 * capability; the provider's buildLaunchCommand never sees any of it, so the VS
 * Code adapter (and any other caller of the provider) cannot carry it.
 *
 * - The MCP server name and the capability variable name are random per launch
 *   (pixel-agents-kb-<hex>, PIXEL_AGENTS_CAP_<HEX>), so nothing outside the
 *   launch can predict either.
 * - The token is ONLY in the environment. argv carries `${<variable>}`, which
 *   claude expands in the http headers of an inline --mcp-config.
 * - The flags go LAST: --allowedTools is variadic and would swallow any
 *   positional argument after it.
 * - NO_PROXY and no_proxy (each on its own) get the loopback names appended to
 *   the value the PTY would otherwise see, so an HTTP proxy in the environment
 *   never carries the token or KB content.
 */

import * as crypto from 'crypto';

import {
  CAPABILITY_ENV_PREFIX,
  KB_ALLOWED_TOOLS_FLAG,
  KB_MCP_CONFIG_FLAG,
  KB_MCP_NAME_RANDOM_BYTES,
  KB_MCP_NO_PROXY_HOSTS,
  KB_MCP_NO_PROXY_KEYS,
  KB_MCP_PATH,
  KB_MCP_SERVER_NAME_PREFIX,
  KB_TOOL_NAMES,
} from './constants.js';

export interface KbLaunchAdditions {
  /** Appended after every other argument. */
  args: string[];
  /** NO_PROXY / no_proxy as the PTY must see them. */
  noProxyEnv: Record<string, string>;
  /** The variable the token goes in. */
  envName: string;
  serverName: string;
}

/** `value` with each loopback name it lacks appended, comma-separated; the
 *  existing items keep their text and order. */
export function withLoopbackNoProxy(value: string | undefined): string {
  const current = value ?? '';
  const present = new Set(current.split(',').map((item) => item.trim().toLowerCase()));
  const missing = KB_MCP_NO_PROXY_HOSTS.filter((host) => !present.has(host));
  if (missing.length === 0) return current;
  if (current.trim() === '') return missing.join(',');
  return `${current}${current.endsWith(',') ? '' : ','}${missing.join(',')}`;
}

/**
 * The additions for one KB launch.
 * @param mcpBaseUrl where this server's /mcp is (kbRuntime.mcpBaseUrl()).
 * @param effectiveEnv the environment the PTY would get without the KB:
 *   `{ ...process.env, ...launch.env }`.
 * @param randomBytes injectable for tests; defaults to crypto.randomBytes.
 */
export function kbLaunchAdditions(
  mcpBaseUrl: string,
  effectiveEnv: Record<string, string | undefined>,
  randomBytes: (size: number) => Buffer = crypto.randomBytes,
): KbLaunchAdditions {
  const serverName = `${KB_MCP_SERVER_NAME_PREFIX}${randomBytes(KB_MCP_NAME_RANDOM_BYTES).toString('hex')}`;
  const envName = `${CAPABILITY_ENV_PREFIX}${randomBytes(KB_MCP_NAME_RANDOM_BYTES).toString('hex').toUpperCase()}`;
  const mcpConfig = JSON.stringify({
    mcpServers: {
      [serverName]: {
        type: 'http',
        url: `${mcpBaseUrl}${KB_MCP_PATH}`,
        headers: { Authorization: `Bearer \${${envName}}` },
      },
    },
  });
  const noProxyEnv: Record<string, string> = {};
  for (const key of KB_MCP_NO_PROXY_KEYS) {
    noProxyEnv[key] = withLoopbackNoProxy(effectiveEnv[key]);
  }
  return {
    args: [
      KB_MCP_CONFIG_FLAG,
      mcpConfig,
      KB_ALLOWED_TOOLS_FLAG,
      ...KB_TOOL_NAMES.map((tool) => `mcp__${serverName}__${tool}`),
    ],
    noProxyEnv,
    envName,
    serverName,
  };
}
