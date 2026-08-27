import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Provide IndexedDB for Dexie in tests
import 'fake-indexeddb/auto';

afterEach(() => {
  cleanup();
});
