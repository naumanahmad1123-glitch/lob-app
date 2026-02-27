import { useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

interface SwipeToLobProps {
  onLob: () => void;
}

export function SwipeToLob({ onLob }: SwipeToLobProps) {
  const [launched, setLaunched] = useState(false);
  const dragY = useMotionValue(0);
  const threshold = -40;

  const progress = useTransform(dragY, [0, threshold], [0, 1]);
  const bgOpacity = useTransform(progress, [0, 1], [0.05, 0.35]);
  const ballScale = useTransform(dragY, [0, threshold], [1, 1.15]);
  const hintOpacity = useTransform(dragY, [0, threshold / 3], [1, 0]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.y < threshold || info.velocity.y < -200) {
      setLaunched(true);
      setTimeout(() => {
        onLob();
        setLaunched(false);
      }, 450);
    }
  }, [onLob, threshold]);

  if (launched) {
    return (
      <div className="relative flex flex-col items-center mt-4">
        <div className="relative w-full h-32 rounded-2xl border border-border/50 bg-secondary/30 overflow-hidden flex items-start justify-center">
          <motion.div
            initial={{ y: 16, opacity: 1, scale: 1 }}
            animate={{ y: -200, opacity: 0, scale: 0.4 }}
            transition={{ type: 'spring', stiffness: 180, damping: 12 }}
            className="text-4xl mt-3"
          >
            🏐
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center mt-4 select-none">
      {/* Glow backdrop */}
      <motion.div
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl pointer-events-none"
      />

      {/* Track area */}
      <div className="relative w-full h-32 rounded-2xl border border-border/50 bg-secondary/30 overflow-visible flex flex-col items-center justify-start">
        {/* Draggable ball */}
        <motion.div
          drag="y"
          dragConstraints={{ top: -100, bottom: 0 }}
          dragElastic={0.15}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{ y: dragY, scale: ballScale }}
          whileTap={{ cursor: 'grabbing' }}
          className="relative z-10 mt-3 cursor-grab"
        >
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow text-3xl active:shadow-[0_0_30px_hsl(var(--primary)/0.6)]">
            🏐
          </div>
        </motion.div>

        {/* Label */}
        <motion.p
          style={{ opacity: hintOpacity }}
          className="text-[11px] font-semibold text-muted-foreground mt-2"
        >
          Swipe up to lob it
        </motion.p>

        {/* Runway arrows */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1 pointer-events-none"
        >
          <ChevronUp className="w-5 h-5 text-primary/40" />
          <ChevronUp className="w-5 h-5 text-primary/20 -mt-3" />
        </motion.div>
      </div>
    </div>
  );
}
