import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, ChevronRight, Zap } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { users, currentUser, groups, lobs, calendarShares } from '@/data/seed';
import { CATEGORY_CONFIG } from '@/data/types';

const INTEREST_LABELS: Record<string, string> = {
  sports: '🏀 Sports',
  dinner: '🍽️ Dinner',
  coffee: '☕ Coffee',
  gym: '💪 Gym',
  padel: '🎾 Padel',
  chill: '😎 Chill',
  travel: '✈️ Travel',
};

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showRateTooltip, setShowRateTooltip] = useState(false);
  const [showAllMutuals, setShowAllMutuals] = useState(false);

  const user = users.find(u => u.id === id);

  // Shared groups: groups where both currentUser and this user are members
  const sharedGroups = useMemo(() => {
    if (!user) return [];
    return groups.filter(
      g => g.members.some(m => m.id === currentUser.id) && g.members.some(m => m.id === user.id)
    );
  }, [user]);

  // Mutual connections: users in at least one group with both currentUser and this user
  const mutualConnections = useMemo(() => {
    if (!user) return [];
    const mutualIds = new Set<string>();
    for (const g of sharedGroups) {
      for (const m of g.members) {
        if (m.id !== currentUser.id && m.id !== user.id) {
          mutualIds.add(m.id);
        }
      }
    }
    return users.filter(u => mutualIds.has(u.id));
  }, [sharedGroups, user]);

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </AppLayout>
    );
  }

  // Privacy check: does this user share calendar details with currentUser?
  const calShare = calendarShares.find(
    cs => cs.ownerId === user.id && ((cs.targetType === 'user' && cs.targetId === currentUser.id) || (cs.targetType === 'group' && sharedGroups.some(g => g.id === cs.targetId)))
  );
  const showFullDetails = calShare?.privacy === 'details';

  // Upcoming confirmed plans (only if full details shared)
  const upcomingPlans = showFullDetails
    ? lobs.filter(l => l.status === 'confirmed' && l.responses.some(r => r.userId === user.id && r.response === 'in'))
    : [];

  // Fake show rate
  const showRate = 85 + (user.id.charCodeAt(1) % 15);

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 pt-12 pb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => navigate('/create')}
            className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4" /> Lob them
          </button>
        </div>

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-card rounded-2xl p-6 border border-border/50 shadow-card mb-6 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-secondary mx-auto flex items-center justify-center text-5xl mb-3">
            {user.avatar}
          </div>
          <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">Making plans since 2025</p>

          {/* Show Rate */}
          <div className="flex justify-center mt-5">
            <div className="relative">
              <p className="text-xl font-bold text-primary">{showRate}%</p>
              <button
                onClick={() => setShowRateTooltip(!showRateTooltip)}
                className="flex items-center gap-0.5 text-[11px] text-muted-foreground mx-auto"
              >
                Show Rate
                <HelpCircle className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showRateTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-52 p-2.5 rounded-xl border border-border bg-card shadow-lg z-10"
                  >
                    <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                      Show Rate is how often this person shows up to confirmed plans 💪
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Interests */}
        <section className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-2">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {user.interests.map(interest => (
              <span key={interest} className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground">
                {INTEREST_LABELS[interest] || interest}
              </span>
            ))}
          </div>
        </section>

        {/* Shared Groups */}
        {sharedGroups.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold text-foreground mb-2">Shared Groups</h3>
            <div className="space-y-2">
              {sharedGroups.map(g => (
                <motion.button
                  key={g.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`/groups/${g.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 active:scale-[0.98] transition-transform"
                >
                  <span className="text-xl">{g.emoji}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.members.length} members</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* Mutual Connections */}
        {mutualConnections.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold text-foreground mb-2">
              Mutual Connections · {mutualConnections.length}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(showAllMutuals ? mutualConnections : mutualConnections.slice(0, 5)).map(mc => (
                <button
                  key={mc.id}
                  onClick={() => navigate(`/user/${mc.id}`)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary border border-border/50 active:scale-95 transition-transform"
                >
                  <span className="text-base">{mc.avatar}</span>
                  <span className="text-xs font-medium text-foreground">{mc.name}</span>
                </button>
              ))}
              {!showAllMutuals && mutualConnections.length > 5 && (
                <button
                  onClick={() => setShowAllMutuals(true)}
                  className="flex items-center px-3 py-1.5 rounded-full bg-secondary/60 border border-border/50 text-xs font-medium text-muted-foreground active:scale-95 transition-transform"
                >
                  +{mutualConnections.length - 5} more
                </button>
              )}
            </div>
          </section>
        )}

        {showFullDetails && upcomingPlans.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold text-foreground mb-2">Upcoming</h3>
            <div className="space-y-2">
              {upcomingPlans.map(l => {
                const config = CATEGORY_CONFIG[l.category];
                const timeStr = l.selectedTime || l.timeOptions[0]?.datetime;
                const formatted = timeStr
                  ? new Date(timeStr).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                  : 'TBD';
                return (
                  <button
                    key={l.id}
                    onClick={() => navigate(`/lob/${l.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 active:scale-[0.98] transition-transform text-left"
                  >
                    <span className="text-xl">{config.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{l.title}</p>
                      <p className="text-xs text-muted-foreground">{formatted}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {!showFullDetails && (
          <div className="rounded-xl bg-secondary/50 border border-border/50 p-4 text-center">
            <p className="text-xs text-muted-foreground">
              🔒 {user.name}'s upcoming plans are private
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default UserProfile;
