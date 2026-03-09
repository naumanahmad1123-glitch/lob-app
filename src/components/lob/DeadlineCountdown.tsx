import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, RotateCw, XCircle, CalendarIcon } from 'lucide-react';
import { format, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DeadlineCountdownProps {
  deadline: string;
  isCreator: boolean;
  quorumReached: boolean;
  isMaybe?: boolean;
}

function getHumanDeadline(deadline: string): { text: string; urgency: 'normal' | 'warning' | 'critical' | 'closed' } {
  const target = new Date(deadline);
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return { text: 'Closed', urgency: 'closed' };

  const mins = differenceInMinutes(target, now);
  const hours = differenceInHours(target, now);
  const days = differenceInDays(target, now);

  if (mins < 15) return { text: 'Closing soon 🔴', urgency: 'critical' };
  if (mins < 60) return { text: `${mins} minutes left`, urgency: 'warning' };

  // Under 24h → "Tonight at 8pm" / "Today at 3pm"
  if (hours < 24) {
    const hour = target.getHours();
    const timeLabel = format(target, 'h:mm a');
    const isTonight = hour >= 18;
    return { text: `${isTonight ? 'Tonight' : 'Today'} at ${timeLabel}`, urgency: hours < 2 ? 'warning' : 'normal' };
  }

  // 24-48h → "Tomorrow at 8pm"
  if (hours < 48) {
    return { text: `Tomorrow at ${format(target, 'h:mm a')}`, urgency: 'normal' };
  }

  // >48h → "5 days left"
  return { text: `${days} days left`, urgency: 'normal' };
}

export const DeadlineCountdown = ({ deadline, isCreator, quorumReached, isMaybe }: DeadlineCountdownProps) => {
  const [deadlineInfo, setDeadlineInfo] = useState(getHumanDeadline(deadline));
  const [showExtend, setShowExtend] = useState(false);
  const [extendDate, setExtendDate] = useState<Date | undefined>(undefined);
  const [extendTime, setExtendTime] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDeadlineInfo(getHumanDeadline(deadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (deadlineInfo.urgency === 'closed' && !quorumReached) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-4 bg-destructive/10 border border-destructive/30 mb-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Timer className="w-5 h-5 text-destructive" />
          <p className="font-bold text-foreground text-sm">Deadline expired</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Not enough people joined in time.</p>

        {isCreator && (
          <AnimatePresence mode="wait">
            {!showExtend ? (
              <motion.div key="buttons" className="flex gap-2">
                <button
                  onClick={() => setShowExtend(true)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
                >
                  <RotateCw className="w-4 h-4" /> Extend
                </button>
                <button className="flex-1 py-2.5 rounded-xl bg-destructive/20 text-destructive font-semibold text-sm flex items-center justify-center gap-2 hover:bg-destructive/30 transition-colors">
                  <XCircle className="w-4 h-4" /> Cancel Plan
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="extend-picker"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <p className="text-xs font-medium text-muted-foreground">Set a new deadline:</p>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn(
                        'flex-1 flex items-center gap-2 p-2.5 rounded-xl border border-border bg-input text-sm text-left',
                        !extendDate && 'text-muted-foreground'
                      )}>
                        <CalendarIcon className="w-4 h-4" />
                        {extendDate ? format(extendDate, 'MMM d') : 'Date'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={extendDate}
                        onSelect={setExtendDate}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                  <input
                    type="time"
                    value={extendTime}
                    onChange={e => setExtendTime(e.target.value)}
                    className="w-24 p-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowExtend(false)}
                    className="flex-1 py-2 rounded-xl bg-secondary text-muted-foreground text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!extendDate || !extendTime}
                    className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
                  >
                    Extend
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    );
  }

  if (deadlineInfo.urgency === 'closed') return null;

  const isCritical = deadlineInfo.urgency === 'critical';
  const isWarning = deadlineInfo.urgency === 'warning';
  const isUrgent = isCritical || isWarning;

  return (
    <div className="space-y-2">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-2xl p-4 border flex items-center gap-3',
          isCritical
            ? 'bg-destructive/5 border-destructive/20'
            : isWarning
            ? 'bg-destructive/5 border-destructive/20'
            : 'bg-secondary/50 border-border/50'
        )}
      >
        <Timer className={cn(
          'w-5 h-5',
          isCritical ? 'text-destructive' : isWarning ? 'text-orange-500' : 'text-primary'
        )} />
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">Deadline</p>
          <p className={cn(
            'font-bold text-sm',
            isCritical ? 'text-destructive animate-pulse' : isWarning ? 'text-orange-500' : 'text-foreground'
          )}>
            {deadlineInfo.text}
          </p>
        </div>
      </motion.div>

      {isMaybe && isUrgent && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-3 bg-lob-maybe/10 border border-lob-maybe/30 flex items-center gap-2"
        >
          <span className="text-base">⏰</span>
          <p className="text-xs font-medium text-foreground">
            You're still a maybe — confirm or you'll be marked out when the deadline passes.
          </p>
        </motion.div>
      )}
    </div>
  );
};
