import { ReactNode, useState, useCallback } from 'react';
import { BottomTabs } from './BottomTabs';
import { LobComposer } from '@/components/lob/LobComposer';
import { LobSentToast } from '@/components/lob/LobSentToast';

export function AppLayout({ children }: { children: ReactNode }) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleLobSent = useCallback(() => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <BottomTabs onLobTap={() => setComposerOpen(true)} />
      <LobComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onLobSent={handleLobSent}
      />
      <LobSentToast show={showToast} />
    </div>
  );
}
