import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveCampusMode } from '@/features/locations/useCampusMode';

/**
 * The URL/env precedence logic is testable as a pure function: when the env
 * flag is off, we never go 3D, regardless of stored or URL state. When the
 * flag is on, URL wins over stored, and stored wins over default.
 *
 * We mutate `import.meta.env.VITE_ENABLE_3D` per test. The env proxy is
 * populated at build time and is read-only in production; in Vitest,
 * `vi.stubEnv` is the supported way to override it.
 */
describe('resolveCampusMode', () => {
  const original = import.meta.env['VITE_ENABLE_3D'];
  let originalLocation: Location;
  beforeEach(() => {
    originalLocation = window.location;
  });
  afterEach(() => {
    // Restore the env proxy to its build-time value.
    if (original === undefined) {
      delete (import.meta.env as Record<string, unknown>)['VITE_ENABLE_3D'];
    } else {
      (import.meta.env as Record<string, unknown>)['VITE_ENABLE_3D'] = original;
    }
  });

  function setUrl(search: string) {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, search },
      writable: true,
      configurable: true,
    });
  }

  it('returns 2d when VITE_ENABLE_3D is not "true"', () => {
    (import.meta.env as Record<string, unknown>)['VITE_ENABLE_3D'] = 'false';
    setUrl('');
    expect(resolveCampusMode('3d')).toBe('2d');
  });

  it('returns 3d when env flag is on and stored preference is "3d"', () => {
    (import.meta.env as Record<string, unknown>)['VITE_ENABLE_3D'] = 'true';
    setUrl('');
    expect(resolveCampusMode('3d')).toBe('3d');
  });

  it('returns 2d when env flag is on, no URL, stored is "2d"', () => {
    (import.meta.env as Record<string, unknown>)['VITE_ENABLE_3D'] = 'true';
    setUrl('');
    expect(resolveCampusMode('2d')).toBe('2d');
  });

  it('returns 3d when env flag is on, no URL, stored is null (default)', () => {
    // The default is 3D when the flag is on and the learner hasn't picked
    // anything. The 3D campus is the headline view; learners opt back to
    // 2D in Settings, which writes a stored '2d' preference.
    (import.meta.env as Record<string, unknown>)['VITE_ENABLE_3D'] = 'true';
    setUrl('');
    expect(resolveCampusMode(null)).toBe('3d');
    expect(resolveCampusMode(undefined)).toBe('3d');
  });

  it('URL ?mode=3d forces 3d even when stored says 2d', () => {
    (import.meta.env as Record<string, unknown>)['VITE_ENABLE_3D'] = 'true';
    setUrl('?mode=3d');
    expect(resolveCampusMode('2d')).toBe('3d');
  });

  it('URL ?mode=2d forces 2d even when stored says 3d', () => {
    (import.meta.env as Record<string, unknown>)['VITE_ENABLE_3D'] = 'true';
    setUrl('?mode=2d');
    expect(resolveCampusMode('3d')).toBe('2d');
  });

  it('URL ?mode=2d returns 2d even when env flag is off', () => {
    (import.meta.env as Record<string, unknown>)['VITE_ENABLE_3D'] = 'false';
    setUrl('?mode=2d');
    expect(resolveCampusMode('3d')).toBe('2d');
  });
});
