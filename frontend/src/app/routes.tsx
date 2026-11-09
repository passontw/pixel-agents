import { Navigate } from 'react-router'
import type { RouteObject } from 'react-router'

import { AgentDetailLayout } from '../layouts/AgentDetailLayout'
import { AppLayout } from '../layouts/AppLayout'
import { AddAgentPage } from '../pages/addAgent/AddAgentPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { FilesChangedPage } from '../pages/agent/FilesChangedPage'
import { RoleActivityPage } from '../pages/agent/RoleActivityPage'
import { SessionLogPage } from '../pages/agent/SessionLogPage'
import { KbReviewPage } from '../pages/kbReview/KbReviewPage'
import { TerminalPage } from '../pages/terminal/TerminalPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { routePatterns } from './paths'

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: routePatterns.newAgent, element: <AddAgentPage /> },
      {
        path: routePatterns.agent,
        element: <AgentDetailLayout />,
        children: [
          { index: true, element: <Navigate to="log" replace /> },
          { path: 'log', element: <SessionLogPage /> },
          { path: 'files', element: <FilesChangedPage /> },
          { path: 'roles', element: <RoleActivityPage /> },
        ],
      },
      { path: routePatterns.terminal, element: <TerminalPage /> },
      { path: routePatterns.kbReview, element: <KbReviewPage /> },
      { path: routePatterns.styleGuide, element: <PlaceholderPage title="Style Guide" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
