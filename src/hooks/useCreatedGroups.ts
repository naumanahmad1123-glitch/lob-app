import { useSyncExternalStore } from 'react';
import { groupStore } from '@/stores/groupStore';

export function useCreatedGroups() {
  return useSyncExternalStore(
    groupStore.subscribe,
    groupStore.getGroups,
    groupStore.getGroups,
  );
}
