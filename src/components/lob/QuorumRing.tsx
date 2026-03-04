import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { users } from '@/data/seed';
import { LobResponse } from '@/data/types';

interface QuorumRingProps {
  current: number;
  target: number;
  responses: LobResponse[];
}

const getName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';
const getAvatar = (userId: string) => users.find(u => u.id === userId)?.avatar || '👤';

function AvatarWithTooltip({ userId, bgClass }: { userId: string; bgClass: string }) {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative" onMouseLeave={() => setShow(false)}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(userId === 'u1' ? '/profile' : `/user/${userId}`);
        }}
        className={`w-7 h-7 rounded-full ${bgClass} border-2 border-card flex items-center justify-center text-sm transition-transform active:scale-90`}
      >
        {getAvatar(userId)}
      </button>
    </div>
  );
}

export function QuorumRing({ current, target, responses }: QuorumRingProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const navigate = useNavigate();
  const pct = Math.min(current / target, 1);
  const reached = current >= target;
  const isEmpty = responses.length === 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);

  const inList = responses.filter(r => r.response === 'in');
  const maybeList = responses.filter(r => r.response === 'maybe');
  const outList = responses.filter(r => r.response === 'out');

  const sections = [
    { key: 'in', label: 'Going', emoji: '✅', list: inList, colorClass: 'text-lob-in', bgClass: 'bg-lob-in/20' },
    { key: 'maybe', label: 'On the fence', emoji: '🤔', list: maybeList, colorClass: 'text-lob-maybe', bgClass: 'bg-lob-maybe/20' },
    { key: 'out', label: "Can't make it", emoji: '❌', list: outList, colorClass: 'text-lob-out', bgClass: 'bg-lob-out/20' },
  ];

  return (
    <>
      <button onClick={() => setSheetOpen(true)} className="w-full text-left">
        <div className="flex items-center gap-5">
          {/* Ring */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
              {isEmpty ? (
                <motion.circle
                  cx="60" cy="60" r={radius}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference * 0.15} ${circumference * 0.85}`}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '60px 60px' }}
                  opacity={0.4}
                />
              ) : (
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
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {reached ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.5 }} className="text-2xl">🎉</motion.span>
              ) : isEmpty ? (
                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="text-[10px] font-medium text-muted-foreground text-center px-2">Waiting…</motion.span>
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
                    <AvatarWithTooltip key={r.userId} userId={r.userId} bgClass="bg-lob-in/20" />
                  ))}
                </div>
                <span className="text-xs font-semibold text-lob-in">{inList.length} going</span>
              </div>
            )}
            {maybeList.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {maybeList.slice(0, 5).map(r => (
                    <AvatarWithTooltip key={r.userId} userId={r.userId} bgClass="bg-lob-maybe/20" />
                  ))}
                </div>
                <span className="text-xs font-semibold text-lob-maybe">{maybeList.length} on the fence</span>
              </div>
            )}
            {outList.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {outList.slice(0, 5).map(r => (
                    <AvatarWithTooltip key={r.userId} userId={r.userId} bgClass="bg-lob-out/20" />
                  ))}
                </div>
                <span className="text-xs font-semibold text-lob-out">{outList.length} can't make it</span>
              </div>
            )}
            {isEmpty && (
              <p className="text-xs text-muted-foreground">No responses yet — be the first!</p>
            )}
          </div>
        </div>
      </button>

      {/* Attendee bottom sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
              className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] max-w-lg mx-auto"
            >
              <div className="bg-card rounded-t-3xl border border-border/50 shadow-card px-5 pb-8 pt-3 max-h-[70vh] overflow-y-auto">
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground mb-5">Attendees</h3>

                {sections.map(sec => (
                  sec.list.length > 0 && (
                    <div key={sec.key} className="mb-5 last:mb-0">
                      <p className={`text-xs font-semibold ${sec.colorClass} mb-2.5`}>
                        {sec.emoji} {sec.label} ({sec.list.length})
                      </p>
                      <div className="space-y-2">
                        {sec.list.map(r => (
                          <button
                            key={r.userId}
                            onClick={() => {
                              setSheetOpen(false);
                              navigate(r.userId === 'u1' ? '/profile' : `/user/${r.userId}`);
                            }}
                            className="w-full flex items-center gap-3 py-1.5 active:scale-[0.98] transition-transform"
                          >
                            <span className={`w-9 h-9 rounded-full ${sec.bgClass} flex items-center justify-center text-lg`}>
                              {getAvatar(r.userId)}
                            </span>
                            <span className="text-sm font-medium text-foreground">{getName(r.userId)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ))}

                {isEmpty && (
                  <p className="text-sm text-muted-foreground text-center py-8">No one has responded yet</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
