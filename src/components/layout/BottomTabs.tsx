import { Home, Users, Plane, User, ChevronUp } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useRef, useState, useEffect } from 'react';

const tabs = [
  { path: '/', matchPaths: ['/'], icon: Home, label: 'Home' },
  { path: '/connect', matchPaths: ['/connect', '/groups'], icon: Users, label: 'Connect' },
  { path: '/trips', matchPaths: ['/trips'], icon: Plane, label: 'Trips' },
  { path: '/profile', matchPaths: ['/profile'], icon: User, label: 'Profile' },
];

const HINT_SEEN_KEY = 'lob-swipe-hint-seen';

interface BottomTabsProps {
  onLobTap: () => void;
}

export function BottomTabs({ onLobTap }: BottomTabsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const touchStartY = useRef<number | null>(null);
  const [pressed, setPressed] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Show swipe hint once after 2s on first visit
  useEffect(() => {
    if (localStorage.getItem(HINT_SEEN_KEY)) return;
    const t = setTimeout(() => {
      setShowHint(true);
      localStorage.setItem(HINT_SEEN_KEY, '1');
      setTimeout(() => setShowHint(false), 3000);
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setPressed(true);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    setPressed(false);
    if (touchStartY.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    touchStartY.current = null;
    if (deltaY > 20) {
      onLobTap();
    }
  }, [onLobTap]);

  const isTabActive = (tab: typeof tabs[0]) =>
    tab.matchPaths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around w-full h-16 px-4">
        {tabs.slice(0, 2).map((tab) => {
          const isActive = isTabActive(tab);
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 min-w-[40px] py-1"
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {isActive && (
                  <motion.div layoutId="tab-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Center Lob button with touch swipe-up */}
        <div className="relative -mt-6 z-50 pointer-events-auto" style={{ touchAction: 'none' }}>
          {/* Swipe hint — shown once */}
          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
              >
                <ChevronUp className="w-4 h-4 text-primary animate-bounce" />
                <span className="text-[8px] font-bold text-primary whitespace-nowrap">Swipe up</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            {/* Glow */}
            <motion.div
              animate={{ opacity: pressed ? 0.8 : 0.3 }}
              className="absolute inset-0 rounded-full bg-primary blur-xl scale-150 pointer-events-none"
            />
            <motion.button
              onClick={onLobTap}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              animate={{ scale: pressed ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              whileTap={{ scale: 0.9, rotate: -8 }}
              className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-glow text-2xl relative z-10 cursor-pointer"
              style={{ touchAction: 'none' }}
            >
              ✨
            </motion.button>
          </div>
          <span className="text-[9px] font-bold text-primary mt-0.5 block text-center">Lob</span>
        </div>

        {tabs.slice(2).map((tab) => {
          const isActive = isTabActive(tab);
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 min-w-[40px] py-1"
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {isActive && (
                  <motion.div layoutId="tab-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
