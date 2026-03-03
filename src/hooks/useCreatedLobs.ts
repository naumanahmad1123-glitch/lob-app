import { useSyncExternalStore } from 'react';
import { lobStore } from '@/stores/lobStore';

export function useCreatedLobs() {
  return useSyncExternalStore(lobStore.subscribe, lobStore.getLobs, lobStore.getLobs);
}
