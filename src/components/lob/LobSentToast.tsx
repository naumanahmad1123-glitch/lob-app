import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface LobSentToastProps {
  show: boolean;
  groupName?: string;
}

export function LobSentToast({ show, groupName }: LobSentToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.6 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[80] px-5 py-3 rounded-2xl gradient-primary shadow-glow flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
          <span className="text-sm font-bold text-primary-foreground">
            Lobbed to {groupName || 'group'}! 🏐
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
