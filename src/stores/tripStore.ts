// DUPLICATE NOTE: Day/time chip generation logic is also in src/pages/LobDetail.tsx (generateDayChips, generateTimeChips).
// Consider consolidating into src/lib/lob-utils.ts in a follow-up.

import { Trip } from '@/data/types';

type Listener = () => void;

let createdTrips: Trip[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn());
}

export const tripStore = {
  addTrip(trip: Trip) {
    createdTrips = [trip, ...createdTrips];
    notify();
  },
  getTrips(): Trip[] {
    return createdTrips;
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
