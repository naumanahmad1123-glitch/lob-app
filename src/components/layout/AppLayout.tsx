import { ReactNode } from 'react';
import { BottomTabs } from './BottomTabs';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <BottomTabs />
    </div>
  );
}
