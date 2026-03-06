import { useSyncExternalStore } from 'react';
import { tripStore } from '@/stores/tripStore';

export function useCreatedTrips() {
  return useSyncExternalStore(tripStore.subscribe, tripStore.getTrips, tripStore.getTrips);
}
