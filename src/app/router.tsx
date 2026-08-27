import { createHashRouter, RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { LandingPage } from '@/pages/LandingPage';
import { HomePage } from '@/pages/HomePage';
import { LabsPage } from '@/pages/LabsPage';
import { LabRunPage } from '@/pages/LabRunPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ReadinessPage } from '@/pages/ReadinessPage';
import { PortfolioPage } from '@/pages/PortfolioPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AppLayout } from '@/components/AppLayout';

// We use createHashRouter (URLs like /#/labs) instead of createBrowserRouter
// (URLs like /labs) so the app works under the file:// protocol when packaged
// with Electron. With createBrowserRouter, every client-side navigation would
// ask the OS for a real file at that path and 404. The hash stays in-page.
const router = createHashRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <AppLayout />
      </ErrorBoundary>
    ),
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'dashboard', element: <HomePage /> },
      { path: 'labs', element: <LabsPage /> },
      { path: 'lab/:labId', element: <LabRunPage /> },
      { path: 'readiness', element: <ReadinessPage /> },
      { path: 'portfolio', element: <PortfolioPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
