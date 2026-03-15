import { ReactNode, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomTabs } from './BottomTabs';
import { LobComposer } from '@/components/lob/LobComposer';
import { LobSentToast } from '@/components/lob/LobSentToast';
import { LobSentAnimation } from '@/components/lob/LobSentAnimation';
import { ComposerContext, type ComposerOptions } from '@/hooks/useComposer';

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerOptions, setComposerOptions] = useState<ComposerOptions>({});
  const [showToast, setShowToast] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleLobSent = useCallback(() => {
    setShowAnimation(true);
    setShowToast(true);
    setTimeout(() => setShowAnimation(false), 1500);
    setTimeout(() => setShowToast(false), 2500);
  }, []);

  useEffect(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  }, [location.pathname]);

  const openComposer = useCallback((options?: ComposerOptions) => {
    setComposerOptions(options || {});
    setComposerOpen(true);
  }, []);

  return (
    <ComposerContext.Provider value={{ openComposer }}>
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 overflow-y-auto" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
          {children}
        </main>

        <BottomTabs onLobTap={() => openComposer()} />
        <LobComposer
          open={composerOpen}
          onClose={() => setComposerOpen(false)}
          onLobSent={handleLobSent}
          prefillText={composerOptions.prefillText}
          prefillUserIds={composerOptions.prefillUserIds}
        />
        <LobSentToast show={showToast} />
        <LobSentAnimation show={showAnimation} />
      </div>
    </ComposerContext.Provider>
  );
}
