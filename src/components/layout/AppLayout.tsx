import { ReactNode, useState, useCallback, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
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

  const handleSwipeUp = (_: any, info: PanInfo) => {
    if (info.offset.y < -50 && info.velocity.y < -100) {
      setComposerOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>

      {/* Swipe-up zone – sits above bottom tabs */}
      {!composerOpen && (
        <motion.div
          onPan={handleSwipeUp}
          className="fixed bottom-16 left-0 right-0 z-40 flex flex-col items-center cursor-grab active:cursor-grabbing select-none touch-pan-x"
        >
          {/* Visual hint */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="flex flex-col items-center pb-2 pt-4 px-8"
          >
            <ChevronUp className="w-5 h-5 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground/40 font-medium tracking-wide">
              Swipe up to Lob
            </span>
          </motion.div>

          {/* Invisible tall touch target */}
          <div className="w-full h-8" />
        </motion.div>
      )}

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
