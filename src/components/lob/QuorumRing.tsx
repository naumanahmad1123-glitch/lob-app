import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LobResponse, User } from '@/data/types';
import { ShowRateBadge } from '@/components/lob/ShowRateBadge';
import { useProfileMap, getProfileName, getProfileAvatar, getProfilePhotoUrl } from '@/hooks/useProfileMap';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/UserAvatar';

interface QuorumRingProps {
  current: number;
  target: number;
  responses: LobResponse[];
  /** All members of the group — used to derive "no response" bucket */
  groupMembers?: User[];
}

const getShowRate = (userId: string) => {
  const total = 5 + (userId.charCodeAt(1) % 10);
  const showed = Math.min(total, Math.round(total * (0.7 + (userId.charCodeAt(1) % 30) / 100)));
  return { total, showed };
};

function AvatarWithTooltip({ userId, bgClass, profileMap }: { userId: string; bgClass: string; profileMap?: Record<string, any> }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(userId === user?.id ? '/profile' : `/user/${userId}`);
        }}
        className={`w-7 h-7 rounded-full ${bgClass} border-2 border-card flex items-center justify-center text-sm transition-transform active:scale-90 cursor-pointer overflow-hidden`}
      >
        {getProfilePhotoUrl(profileMap, userId) ? (
          <img src={getProfilePhotoUrl(profileMap, userId)!} alt="" className="w-full h-full object-cover" />
        ) : (
          getProfileAvatar(profileMap, userId)
        )}
      </button>
    </div>
  );
}

export function QuorumRing({ current, target, responses, groupMembers = [] }: QuorumRingProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Collect all user IDs for profile lookup
  const allUserIds = useMemo(() => {
    const ids = responses.map(r => r.userId);
    groupMembers.forEach(m => ids.push(m.id));
    return ids;
  }, [responses, groupMembers]);

  const { data: profileMap } = useProfileMap(allUserIds);

  const pct = Math.min(current / target, 1);
  const reached = current >= target;
  const isEmpty = responses.length === 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);

  const inList = responses.filter(r => r.response === 'in');
  const maybeList = responses.filter(r => r.response === 'maybe');
  const outList = responses.filter(r => r.response === 'out');

  const respondedIds = new Set(responses.map(r => r.userId));
  const noResponseList = groupMembers.filter(m => !respondedIds.has(m.id));

  const sections = [
    { key: 'in', label: 'In', sublabel: 'Counts toward quorum', emoji: '✅', list: inList.map(r => r.userId), colorClass: 'text-lob-in', bgClass: 'bg-lob-in/20' },
    { key: 'maybe', label: 'Maybe', sublabel: 'Interested, not committed', emoji: '🤔', list: maybeList.map(r => r.userId), colorClass: 'text-lob-maybe', bgClass: 'bg-lob-maybe/20' },
    { key: 'no-response', label: 'No response', sublabel: 'Haven\'t responded yet', emoji: '⏳', list: noResponseList.map(m => m.id), colorClass: 'text-muted-foreground', bgClass: 'bg-secondary' },
    { key: 'out', label: "Can't make it", sublabel: '', emoji: '❌', list: outList.map(r => r.userId), colorClass: 'text-lob-out', bgClass: 'bg-lob-out/20' },
  ];

  return (
    <>
      <button onClick={() => setSheetOpen(true)} className="w-full text-left cursor-pointer">
        <div className="flex items-center gap-3">
          {/* Ring */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
              {isEmpty ? (
                <motion.circle
                  cx="60" cy="60" r={radius}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="10"
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
                  strokeWidth="10"
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
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.5 }} className="text-base">🎉</motion.span>
              ) : isEmpty ? (
                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="text-[9px] font-medium text-muted-foreground text-center px-1">Waiting…</motion.span>
              ) : (
                <>
                  <span className="text-lg font-extrabold text-foreground leading-none">{current}</span>
                  <span className="text-[9px] font-medium text-muted-foreground">of {target}</span>
                </>
              )}
            </div>
          </div>

          {/* Compact counts + names */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {inList.length > 0 && (
                <span className="text-[11px] font-semibold text-lob-in bg-lob-in/10 px-2 py-0.5 rounded-full">{inList.length} in</span>
              )}
              {maybeList.length > 0 && (
                <span className="text-[11px] font-semibold text-lob-maybe bg-lob-maybe/10 px-2 py-0.5 rounded-full">{maybeList.length} maybe</span>
              )}
              {outList.length > 0 && (
                <span className="text-[11px] font-semibold text-lob-out bg-lob-out/10 px-2 py-0.5 rounded-full">{outList.length} out</span>
              )}
              {noResponseList.length > 0 && (
                <span className="text-[11px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{noResponseList.length} pending</span>
              )}
            </div>
            {inList.length > 0 ? (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {inList.slice(0, 4).map(r => r.userId === user?.id ? 'You' : getProfileName(profileMap, r.userId).split(' ')[0]).join(', ')}
                {inList.length > 4 && ` +${inList.length - 4}`}
              </p>
            ) : isEmpty && noResponseList.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">No responses yet — be the first!</p>
            ) : null}
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
              exit={{ opacity: 0, pointerEvents: 'none' as any }}
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
                        {sec.sublabel && <span className="font-normal text-muted-foreground ml-1">— {sec.sublabel}</span>}
                      </p>
                      <div className="space-y-2">
                        {sec.list.map(userId => (
                          <button
                            key={userId}
                            onClick={() => {
                              setSheetOpen(false);
                              navigate(userId === user?.id ? '/profile' : `/user/${userId}`);
                            }}
                            className="w-full flex items-center gap-3 py-1.5 active:scale-[0.98] transition-transform cursor-pointer"
                          >
                            <UserAvatar photoUrl={getProfilePhotoUrl(profileMap, userId)} emoji={getProfileAvatar(profileMap, userId)} size="sm" className={sec.bgClass} />
                            <span className="text-sm font-medium text-foreground flex-1 text-left">
                              {userId === user?.id ? 'You' : getProfileName(profileMap, userId)}
                            </span>
                            {sec.key !== 'no-response' && (() => {
                              const sr = getShowRate(userId);
                              return <ShowRateBadge total={sr.total} showed={sr.showed} compact />;
                            })()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ))}

                {isEmpty && noResponseList.length === 0 && (
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
