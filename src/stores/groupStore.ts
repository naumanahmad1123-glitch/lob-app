import { Group, User } from '@/data/types';

type Listener = () => void;

let createdGroups: Group[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn());
}

export const groupStore = {
  addGroup(group: Group) {
    createdGroups = [group, ...createdGroups];
    notify();
  },
  getGroups(): Group[] {
    return createdGroups;
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
