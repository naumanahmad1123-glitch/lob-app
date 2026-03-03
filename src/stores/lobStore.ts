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
  getLobs(): Lob[] {
    return createdLobs;
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
