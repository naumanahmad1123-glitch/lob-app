import { currentUser } from '@/data/seed';

type Listener = () => void;

interface ProfileData {
  name: string;
  avatar: string;
  interests: string[];
}

let profile: ProfileData = {
  name: currentUser.name,
  avatar: currentUser.avatar,
  interests: [...currentUser.interests],
};

const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn());
}

export const profileStore = {
  getProfile(): ProfileData {
    return profile;
  },
  updateProfile(updates: Partial<ProfileData>) {
    profile = { ...profile, ...updates };
    // Also update the seed currentUser so it reflects everywhere
    if (updates.name !== undefined) currentUser.name = updates.name;
    if (updates.avatar !== undefined) currentUser.avatar = updates.avatar;
    if (updates.interests !== undefined) currentUser.interests = [...updates.interests];
    notify();
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
