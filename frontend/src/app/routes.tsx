import { Navigate } from 'react-router'
import type { RouteObject } from 'react-router'

import { AgentDetailLayout } from '../layouts/AgentDetailLayout'
import { AppLayout } from '../layouts/AppLayout'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { routePatterns } from './paths'

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: routePatterns.newAgent, element: <PlaceholderPage title="新增 Agent" /> },
      {
        path: routePatterns.agent,
        element: <AgentDetailLayout />,
        children: [
          { index: true, element: <Navigate to="log" replace /> },
          { path: 'log', element: <PlaceholderPage title="Session Log" /> },
          { path: 'files', element: <PlaceholderPage title="Files Changed" /> },
          { path: 'roles', element: <PlaceholderPage title="Role Activity" /> },
        ],
      },
      { path: routePatterns.terminal, element: <PlaceholderPage title="Terminal" /> },
      { path: routePatterns.kbReview, element: <PlaceholderPage title="知識庫寫入審核" /> },
      { path: routePatterns.styleGuide, element: <PlaceholderPage title="Style Guide" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
