import { Home, Users, Share2, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useCallback, useState } from 'react';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/groups', icon: Users, label: 'Groups' },
  { path: '/sharing', icon: Share2, label: 'Sharing' },
  { path: '/profile', icon: User, label: 'Profile' },
];

interface BottomTabsProps {
  onLobTap: () => void;
  notificationCount?: number;
}

export function BottomTabs({ onLobTap, notificationCount = 3 }: BottomTabsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dragY = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);

  const ballScale = useTransform(dragY, [0, -80], [1, 1.25]);
  const glowOpacity = useTransform(dragY, [0, -80], [0.3, 0.8]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.y < -40 || info.velocity.y < -200) {
      onLobTap();
    }
  }, [onLobTap]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16 px-2">
        {tabs.slice(0, 2).map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 min-w-[48px] py-1"
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

        {/* Center Lob button - draggable upward */}
        <div className="relative -mt-6">
          <motion.div
            style={{ scale: ballScale }}
            className="relative"
          >
            {/* Glow */}
            <motion.div
              style={{ opacity: glowOpacity }}
              className="absolute inset-0 rounded-full bg-primary blur-xl scale-150 pointer-events-none"
            />
            <motion.div
              drag="y"
              dragConstraints={{ top: -100, bottom: 0 }}
              dragElastic={0.15}
              dragMomentum={false}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              style={{ y: dragY }}
              whileTap={{ scale: 0.9, rotate: -8 }}
              onClick={() => !isDragging && onLobTap()}
              className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-glow text-2xl cursor-grab active:cursor-grabbing relative z-10"
            >
              🪃
            </motion.div>
          </motion.div>
          <span className="text-[9px] font-bold text-primary mt-0.5 block text-center">Lob</span>
        </div>

        {tabs.slice(2).map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          const isExplore = tab.path === '/explore';
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 min-w-[48px] py-1"
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
