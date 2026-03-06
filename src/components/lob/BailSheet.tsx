import { motion } from 'framer-motion';
import { AlertTriangle, Shield } from 'lucide-react';

interface BailSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Whether the lob deadline has already passed */
  pastDeadline: boolean;
  userName: string;
}

export function BailSheet({ open, onClose, onConfirm, pastDeadline, userName }: BailSheetProps) {
  if (!open) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-background/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto"
      >
        <div className="bg-card rounded-t-3xl border border-border/50 shadow-card px-5 pb-8 pt-3">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          <div className="flex items-center gap-3 mb-4">
            {pastDeadline ? (
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-lob-in/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-lob-in" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-extrabold text-foreground">
                {pastDeadline ? 'Are you sure?' : "Can't make it?"}
              </h3>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {pastDeadline
              ? "The deadline has passed — bailing now will affect your show rate."
              : "You're still within the grace period — bailing now won't affect your show rate."
            }
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-lob-in text-primary-foreground font-semibold text-sm"
            >
              Actually, I'm in
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm ${
                pastDeadline
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-secondary text-foreground'
              }`}
            >
              Yes, bail
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
