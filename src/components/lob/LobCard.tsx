import { motion } from 'framer-motion';
import { MapPin, Clock, ChevronRight, Repeat, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Lob, CATEGORY_CONFIG, RECURRENCE_OPTIONS, FLEXIBLE_WINDOW_OPTIONS } from '@/data/types';
import { currentUser } from '@/data/seed';
import { QuorumBar } from './QuorumBar';
import { StatusPill } from './StatusPill';

interface LobCardProps {
  lob: Lob;
  index?: number;
}

export function LobCard({ lob, index = 0 }: LobCardProps) {
  const navigate = useNavigate();
  const config = CATEGORY_CONFIG[lob.category];
  const isYours = lob.createdBy === currentUser.id;
  const inCount = lob.responses.filter(r => r.response === 'in').length;
  const timeStr = lob.selectedTime || lob.timeOptions[0]?.datetime;
  const formattedTime = (() => {
    if (lob.whenMode === 'tbd') return 'Time TBD';
    if (lob.whenMode === 'flexible' && lob.flexibleWindow) {
      return FLEXIBLE_WINDOW_OPTIONS.find(o => o.key === lob.flexibleWindow)?.displayLabel || 'Flexible';
    }
    if (timeStr) {
      return new Date(timeStr).toLocaleString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    return 'TBD';
  })();
  const recurrenceLabel = lob.recurrence
    ? RECURRENCE_OPTIONS.find(r => r.key === lob.recurrence)?.label
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={() => navigate(`/lob/${lob.id}`)}
      className="gradient-card rounded-2xl p-4 shadow-card border border-border/50 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="relative text-2xl">
            {config.emoji}
            {isYours && (
              <Crown className="absolute -top-1.5 -right-1.5 w-3 h-3 text-primary fill-primary" />
            )}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground text-[15px] leading-tight">{lob.title}</h3>
              {isYours && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full leading-none">
                  Yours
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{lob.groupName}</p>
          </div>
        </div>
        <StatusPill status={lob.status} />
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formattedTime}
        </span>
        {lob.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {lob.location}
          </span>
        )}
        {recurrenceLabel && (
          <span className="flex items-center gap-1 text-primary">
            <Repeat className="w-3 h-3" />
            {recurrenceLabel}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <QuorumBar current={inCount} target={lob.quorum} />
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </motion.div>
  );
}
