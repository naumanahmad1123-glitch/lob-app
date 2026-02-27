import { motion } from 'framer-motion';
import { users } from '@/data/seed';
import { LobResponse } from '@/data/types';

interface QuorumRingProps {
  current: number;
  target: number;
  responses: LobResponse[];
}

export function QuorumRing({ current, target, responses }: QuorumRingProps) {
  const pct = Math.min(current / target, 1);
  const reached = current >= target;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);

  const inList = responses.filter(r => r.response === 'in');
  const maybeList = responses.filter(r => r.response === 'maybe');
  const outList = responses.filter(r => r.response === 'out');

  const getAvatar = (userId: string) => users.find(u => u.id === userId)?.avatar || '👤';

  return (
    <div className="flex items-center gap-5">
      {/* Ring */}
      <div className="relative w-32 h-32 flex-shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={reached ? 'hsl(var(--lob-confirmed))' : 'hsl(var(--primary))'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {reached ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.5 }}
              className="text-2xl"
            >
              🎉
            </motion.span>
          ) : (
            <>
              <span className="text-2xl font-extrabold text-foreground">{current}</span>
              <span className="text-[10px] font-medium text-muted-foreground">of {target}</span>
            </>
          )}
        </div>
      </div>

      {/* Avatar stacks */}
      <div className="flex-1 space-y-2.5">
        {inList.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {inList.slice(0, 5).map(r => (
                <span key={r.userId} className="w-7 h-7 rounded-full bg-lob-in/20 border-2 border-card flex items-center justify-center text-sm">
                  {getAvatar(r.userId)}
                </span>
              ))}
            </div>
            <span className="text-xs font-semibold text-lob-in">{inList.length} in</span>
          </div>
        )}
        {maybeList.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {maybeList.slice(0, 5).map(r => (
                <span key={r.userId} className="w-7 h-7 rounded-full bg-lob-maybe/20 border-2 border-card flex items-center justify-center text-sm">
                  {getAvatar(r.userId)}
                </span>
              ))}
            </div>
            <span className="text-xs font-semibold text-lob-maybe">{maybeList.length} maybe</span>
          </div>
        )}
        {outList.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {outList.slice(0, 5).map(r => (
                <span key={r.userId} className="w-7 h-7 rounded-full bg-lob-out/20 border-2 border-card flex items-center justify-center text-sm">
                  {getAvatar(r.userId)}
                </span>
              ))}
            </div>
            <span className="text-xs font-semibold text-lob-out">{outList.length} out</span>
          </div>
        )}
      </div>
    </div>
  );
}
