import { useSyncExternalStore } from 'react';
import { profileStore } from '@/stores/profileStore';

export function useProfile() {
  return useSyncExternalStore(profileStore.subscribe, profileStore.getProfile, profileStore.getProfile);
}
