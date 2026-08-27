import { create } from 'zustand';
import { db } from '@/lib/db/client';

interface ProfileState {
  profileId: string | null;
  profile: { id: string; name: string; schedule: string; createdAt: number } | null;
  hasProfile: boolean;
  createProfile: (name: string, schedule: string) => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profileId: null,
  profile: null,
  hasProfile: false,

  loadProfile: async () => {
    const profiles = await db.profiles.toArray();
    if (profiles.length > 0) {
      const p = profiles[0]!;
      set({ profileId: p.id, profile: p, hasProfile: true });
    }
  },

  createProfile: async (name, schedule) => {
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    await db.profiles.add({ id, name, schedule: schedule as '6' | '8' | '12' | '16', createdAt });
    set({ profileId: id, profile: { id, name, schedule, createdAt }, hasProfile: true });
  },
}));
