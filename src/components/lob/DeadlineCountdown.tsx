import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, RotateCw, XCircle, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DeadlineCountdownProps {
  deadline: string;
  isCreator: boolean;
  quorumReached: boolean;
}

function getTimeLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { hours, minutes, seconds, total: diff };
}

export const DeadlineCountdown = ({ deadline, isCreator, quorumReached }: DeadlineCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(deadline));
  const [expired, setExpired] = useState(!getTimeLeft(deadline));
  const [showExtend, setShowExtend] = useState(false);
  const [extendDate, setExtendDate] = useState<Date | undefined>(undefined);
  const [extendTime, setExtendTime] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const tl = getTimeLeft(deadline);
      setTimeLeft(tl);
      if (!tl) {
        setExpired(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (expired && !quorumReached) {
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

  if (!timeLeft) return null;

  const isUrgent = timeLeft.total < 2 * 60 * 60 * 1000; // < 2 hours

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl p-4 border mb-4 flex items-center gap-3',
        isUrgent
          ? 'bg-destructive/5 border-destructive/20'
          : 'bg-secondary/50 border-border/50'
      )}
    >
      <Timer className={cn('w-5 h-5', isUrgent ? 'text-destructive' : 'text-primary')} />
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground">Deadline</p>
        <p className={cn('font-bold text-sm tabular-nums', isUrgent ? 'text-destructive' : 'text-foreground')}>
          {timeLeft.hours > 0 && `${timeLeft.hours}h `}
          {timeLeft.minutes}m {timeLeft.seconds}s left
        </p>
      </div>
    </motion.div>
  );
};
