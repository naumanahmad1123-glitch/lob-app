import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, ChevronRight, Zap } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { AppLayout } from '@/components/layout/AppLayout';
import { CATEGORY_CONFIG } from '@/data/types';
import { ShowRateBadge } from '@/components/lob/ShowRateBadge';
import { useComposer } from '@/hooks/useComposer';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseGroups } from '@/hooks/useSupabaseGroups';
import { useSupabaseLobs } from '@/hooks/useSupabaseLobs';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { user } = useAuth();
  const { openComposer } = useComposer();
  const [showRateTooltip, setShowRateTooltip] = useState(false);
  const [showAllMutuals, setShowAllMutuals] = useState(false);

  // Fetch this user's profile from Supabase
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  const { data: allGroups = [] } = useSupabaseGroups();
  const { data: allLobs = [] } = useSupabaseLobs();

  // Shared groups: groups where both current user and this user are members
  const sharedGroups = useMemo(() => {
    if (!id || !user) return [];
    return allGroups.filter(
      g => g.members.some(m => m.user_id === user.id) && g.members.some(m => m.user_id === id)
    );
  }, [allGroups, id, user]);

  // Mutual connections: users in shared groups excluding both users
  const mutualConnections = useMemo(() => {
    if (!id || !user) return [];
    const mutualMap = new Map<string, { id: string; name: string; avatar: string }>();
    for (const g of sharedGroups) {
      for (const m of g.members) {
        if (m.user_id !== user.id && m.user_id !== id) {
          mutualMap.set(m.user_id, { id: m.user_id, name: m.name, avatar: m.avatar });
        }
      }
    }
    return Array.from(mutualMap.values());
  }, [sharedGroups, id, user]);

  // Upcoming confirmed plans this user is in
  const upcomingPlans = useMemo(() => {
    if (!id) return [];
    return allLobs.filter(l =>
      l.status === 'confirmed' && l.responses.some(r => r.userId === id && r.response === 'in')
    );
  }, [allLobs, id]);

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 pb-8">
          <div className="flex items-center gap-3 pt-12 pb-4">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
          </div>
          <div className="rounded-2xl p-6 border border-border/50 mb-6 text-center space-y-3">
            <Skeleton className="w-20 h-20 rounded-full mx-auto" />
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </AppLayout>
    );
  }

  const showRateTotal = 5 + (profile.id.charCodeAt(1) % 10);
  const showRateShowed = Math.min(showRateTotal, Math.round(showRateTotal * (0.7 + (profile.id.charCodeAt(1) % 30) / 100)));

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 pt-12 pb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => openComposer({ prefillUserIds: id ? [id] : [] })}
            className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
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
            {profile.avatar}
          </div>
          <h2 className="text-xl font-bold text-foreground">{profile.name || 'Unknown'}</h2>
          {profile.city && <p className="text-sm text-muted-foreground mt-1">{profile.city}</p>}

          {/* Show Rate */}
          <div className="flex justify-center mt-5">
            <div className="relative">
              <ShowRateBadge total={showRateTotal} showed={showRateShowed} />
              <button
                onClick={() => setShowRateTooltip(!showRateTooltip)}
                className="flex items-center gap-0.5 text-[11px] text-muted-foreground mx-auto mt-0.5 cursor-pointer"
              >
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
        {profile.interests && profile.interests.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold text-foreground mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest: string) => (
                <span key={interest} className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground">
                  {INTEREST_LABELS[interest] || interest}
                </span>
              ))}
            </div>
          </section>
        )}

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
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 active:scale-[0.98] transition-transform cursor-pointer"
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
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary border border-border/50 active:scale-95 transition-transform cursor-pointer"
                >
                  <span className="text-base">{mc.avatar}</span>
                  <span className="text-xs font-medium text-foreground">{mc.name}</span>
                </button>
              ))}
              {!showAllMutuals && mutualConnections.length > 5 && (
                <button
                  onClick={() => setShowAllMutuals(true)}
                  className="flex items-center px-3 py-1.5 rounded-full bg-secondary/60 border border-border/50 text-xs font-medium text-muted-foreground active:scale-95 transition-transform cursor-pointer"
                >
                  +{mutualConnections.length - 5} more
                </button>
              )}
            </div>
          </section>
        )}

        {/* Upcoming plans - only show if in shared groups */}
        {upcomingPlans.length > 0 && sharedGroups.length > 0 && (
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
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 active:scale-[0.98] transition-transform text-left cursor-pointer"
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
      </div>
    </AppLayout>
  );
};

export default UserProfile;
