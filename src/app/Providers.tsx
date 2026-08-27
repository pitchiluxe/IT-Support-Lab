import type { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from './ToastProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
