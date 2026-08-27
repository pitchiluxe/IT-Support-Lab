import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProfileStore } from '@/features/profile/store';
import { db } from '@/lib/db/client';

describe('useProfileStore', () => {
  beforeEach(async () => {
    await db.profiles.clear();
    useProfileStore.setState({ profileId: null, profile: null, hasProfile: false });
  });

  it('hasProfile is false initially', () => {
    const { result } = renderHook(() => useProfileStore());
    expect(result.current.hasProfile).toBe(false);
  });

  it('createProfile persists to Dexie and updates state', async () => {
    const { result } = renderHook(() => useProfileStore());
    await act(async () => {
      await result.current.createProfile('Alex', '12');
    });
    expect(result.current.hasProfile).toBe(true);
    expect(result.current.profile?.name).toBe('Alex');
    expect(result.current.profile?.schedule).toBe('12');

    const rows = await db.profiles.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe('Alex');
  });

  it('loadProfile restores from Dexie on app start', async () => {
    const id = crypto.randomUUID();
    await db.profiles.add({ id, name: 'Existing', schedule: '8', createdAt: Date.now() });

    const { result } = renderHook(() => useProfileStore());
    await act(async () => {
      await result.current.loadProfile();
    });

    expect(result.current.hasProfile).toBe(true);
    expect(result.current.profile?.name).toBe('Existing');
    expect(result.current.profileId).toBe(id);
  });
});
