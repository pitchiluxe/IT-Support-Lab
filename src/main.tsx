import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from '@/app/router';
import { Providers } from '@/app/Providers';
import { useProfileStore } from '@/features/profile/store';
import { seedLabs } from '@/features/lab-engine/db-init';
import { logger } from '@/lib/logger';
import '@/styles/index.css';

async function boot() {
  // Seed curriculum content (idempotent) before rendering
  try {
    await seedLabs();
  } catch (err) {
    logger.error('Failed to seed labs', { err: err instanceof Error ? err.message : String(err) });
  }

  // Load active profile (if any)
  try {
    await useProfileStore.getState().loadProfile();
  } catch (err) {
    logger.error('Failed to load profile', { err: err instanceof Error ? err.message : String(err) });
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Providers>
        <AppRouter />
      </Providers>
    </React.StrictMode>,
  );
}

void boot();
