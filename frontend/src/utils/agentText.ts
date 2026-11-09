import type { Agent, PermissionRole, RoleCode } from '../domain/types'
import { formatElapsed } from './time'

/** 側欄第二行：running 帶計時，idle 的 KB Writer 帶標記。 */
export function agentDetailText(agent: Agent, now: number, pendingKbCount: number): string {
  if (agent.status === 'running') return `running · ${formatElapsed(now - agent.startedAt)}`
  if (agent.status === 'waiting') return 'waiting'
  if (agent.isKbWriter) {
    return pendingKbCount > 0 ? `KB Writer · ${pendingKbCount} pending` : 'idle · KB Writer'
  }
  return 'idle'
}

/** 徽章：權限角色，KB Writer 另加 W。 */
export function agentRoleCodes(agent: Agent): RoleCode[] {
  return agent.isKbWriter ? [...agent.permissionRoles, 'W'] : agent.permissionRoles
}

const ROLE_PRECEDENCE: PermissionRole[] = ['D', 'E', 'R']

/** 目前的 Auto Role：已指派角色中權限最高者（與設計稿的脈絡列與狀態列一致）。 */
export function currentAutoRole(agent: Agent): PermissionRole | undefined {
  return ROLE_PRECEDENCE.find((role) => agent.permissionRoles.includes(role))
}
