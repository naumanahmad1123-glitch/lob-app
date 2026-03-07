import { Trip } from '@/data/types';

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
  updateTrip(id: string, updates: Partial<Trip>) {
    createdTrips = createdTrips.map(t => t.id === id ? { ...t, ...updates } : t);
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
