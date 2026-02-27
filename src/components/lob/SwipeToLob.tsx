import { useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

interface SwipeToLobProps {
  onLob: () => void;
}

export function SwipeToLob({ onLob }: SwipeToLobProps) {
  const [launched, setLaunched] = useState(false);
  const dragY = useMotionValue(0);
  const threshold = -80;

  // Visual feedback: scale and glow intensity based on drag progress
  const progress = useTransform(dragY, [0, threshold], [0, 1]);
  const bgOpacity = useTransform(progress, [0, 1], [0.1, 0.4]);
  const ballScale = useTransform(dragY, [0, threshold], [1, 1.2]);
  const hintOpacity = useTransform(dragY, [0, threshold / 2], [1, 0]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.y < threshold) {
      setLaunched(true);
      // Small delay so user sees the launch animation
      setTimeout(() => {
        onLob();
        setLaunched(false);
      }, 500);
    }
  }, [onLob, threshold]);

  return (
    <div className="relative flex flex-col items-center mt-4 select-none">
      {/* Glow backdrop */}
      <motion.div
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl pointer-events-none"
      />

      {/* Track area */}
      <div className="relative w-full h-36 rounded-2xl border border-border/50 bg-secondary/30 overflow-hidden flex flex-col items-center justify-end">
        {/* Runway lines */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="absolute inset-x-0 top-4 flex flex-col items-center gap-2 pointer-events-none"
        >
          <ChevronUp className="w-5 h-5 text-primary/40" />
          <ChevronUp className="w-5 h-5 text-primary/25 -mt-3" />
          <ChevronUp className="w-5 h-5 text-primary/15 -mt-3" />
        </motion.div>

        {/* Draggable ball */}
        <motion.div
          drag="y"
          dragConstraints={{ top: -120, bottom: 0 }}
          dragElastic={0.3}
          onDragEnd={handleDragEnd}
          style={{ y: dragY, scale: ballScale }}
          animate={launched ? { y: -300, opacity: 0, scale: 0.5 } : {}}
          transition={launched ? { type: 'spring', stiffness: 200, damping: 15 } : undefined}
          className="relative z-10 mb-3 cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow text-3xl">
            🏐
          </div>
        </motion.div>

        {/* Label */}
        <motion.p
          style={{ opacity: hintOpacity }}
          className="text-xs font-semibold text-muted-foreground pb-2"
        >
          Swipe up to lob it
        </motion.p>
      </div>
    </div>
  );
}
