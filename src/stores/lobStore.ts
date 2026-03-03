import { Lob } from '@/data/types';

type Listener = () => void;

let createdLobs: Lob[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn());
}

export const lobStore = {
  addLob(lob: Lob) {
    createdLobs = [lob, ...createdLobs];
    notify();
  },
  updateLobTime(lobId: string, newDatetime: string) {
    createdLobs = createdLobs.map(l => {
      if (l.id !== lobId) return l;
      return {
        ...l,
        timeOptions: l.timeOptions.map((t, i) =>
          i === 0 ? { ...t, datetime: newDatetime } : t
        ),
      };
    });
    notify();
  },
  getLobs(): Lob[] {
    return createdLobs;
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
