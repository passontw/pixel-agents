import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { matchPath, NavLink, Outlet, useLocation, useParams } from 'react-router'

import { AGENT_TABS } from '../app/paths'
import { PageHeader } from '../components/PageHeader'

/** Agent 詳細頁：標題加上用路由切換的分頁，內容由子路由的 Outlet 提供。 */
export function AgentDetailLayout() {
  const { agentId = '' } = useParams()
  const { pathname } = useLocation()
  const activeTab =
    AGENT_TABS.find((tab) => matchPath(`/agents/:agentId/${tab.value}`, pathname))?.value ?? false

  return (
    <>
      <PageHeader title={agentId} />
      <Tabs value={activeTab} aria-label="Agent 分頁">
        {AGENT_TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            component={NavLink}
            to={tab.value}
          />
        ))}
      </Tabs>
      <Outlet />
    </>
  )
}
