import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronRight, Bell, Calendar, Shield, LogOut, Plane, Users, HelpCircle, Eye, EyeOff, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { currentUser, trips, calendarShares, users, groups } from '@/data/seed';
import { CalendarPrivacy } from '@/data/types';
import { TappableAvatar } from '@/components/TappableAvatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShowRateBadge } from '@/components/lob/ShowRateBadge';

const Profile = () => {
  const navigate = useNavigate();
  const [showRateTooltip, setShowRateTooltip] = useState(false);
  const [showSharingPrivacy, setShowSharingPrivacy] = useState(false);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const [localShares, setLocalShares] = useState(calendarShares);
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);
  const activeTrips = trips.filter(t => t.userId === currentUser.id && t.showOnProfile);

  const togglePrivacy = (shareId: string) => {
    setLocalShares(prev => prev.map(s =>
      s.id === shareId
        ? { ...s, privacy: (s.privacy === 'details' ? 'free-busy' : 'details') as CalendarPrivacy }
        : s
    ));
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out');
      navigate('/');
    }
  };

  const handleMenuTap = (label: string) => {
    if (label === 'Notifications') {
      navigate('/notifications');
    } else {
      setShowComingSoon(label);
      setTimeout(() => setShowComingSoon(null), 2000);
    }
  };

  const menuItems = [
    { icon: Bell, label: 'Notifications', desc: 'Manage alerts' },
    { icon: Calendar, label: 'Calendar Sync', desc: 'Connect calendars' },
    { icon: Shield, label: 'Privacy', desc: 'Control your data' },
  ];

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between pt-12 pb-6">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Profile</h1>
          <button
            onClick={() => {
              setShowComingSoon('Settings');
              setTimeout(() => setShowComingSoon(null), 2000);
            }}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Coming soon toast */}
        <AnimatePresence>
          {showComingSoon && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl bg-card border border-border shadow-card"
            >
              <p className="text-sm font-medium text-foreground">{showComingSoon} — coming soon ✨</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-card rounded-2xl p-6 border border-border/50 shadow-card mb-6 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-secondary mx-auto flex items-center justify-center text-4xl mb-3">
            {currentUser.avatar}
          </div>
          <h2 className="text-xl font-bold text-foreground">{currentUser.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">Making plans since 2026</p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-5">
            <div>
              <p className="text-xl font-bold text-foreground">12</p>
              <p className="text-[11px] text-muted-foreground">Plans Made</p>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">4</p>
              <p className="text-[11px] text-muted-foreground">Groups</p>
            </div>
            <div className="relative">
              <ShowRateBadge total={12} showed={11} />
              <button
                onClick={() => setShowRateTooltip(!showRateTooltip)}
                className="flex items-center gap-0.5 text-[11px] text-muted-foreground mx-auto mt-0.5"
              >
                <HelpCircle className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showRateTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 p-2.5 rounded-xl border border-border bg-card shadow-lg z-10"
                  >
                    <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                      How often you actually show up to confirmed plans. Keep it high to stay reliable! 💪
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Active trip badge */}
          {activeTrips.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border/50">
              {activeTrips.map(trip => (
                <button
                  key={trip.id}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                  className="flex items-center gap-2 mx-auto px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20"
                >
                  <Plane className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-semibold text-accent">
                    {trip.emoji} {trip.city} · {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Groups shortcut */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/groups')}
          className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary transition-all mb-4"
        >
          <Users className="w-5 h-5 text-primary" />
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">My Groups</p>
            <p className="text-xs text-muted-foreground">View and manage your groups</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.button>

        {/* Sharing & Privacy */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowSharingPrivacy(!showSharingPrivacy)}
          className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary transition-all mb-6"
        >
          <Eye className="w-5 h-5 text-primary" />
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">Sharing & Privacy</p>
            <p className="text-xs text-muted-foreground">Calendar sharing & privacy levels</p>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showSharingPrivacy ? 'rotate-90' : ''}`} />
        </motion.button>

        <AnimatePresence>
          {showSharingPrivacy && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6 -mt-4"
            >
              <div className="pt-2 space-y-2 px-1">
                {localShares.map((share, i) => {
                  const isUser = share.targetType === 'user';
                  const target = isUser
                    ? users.find(u => u.id === share.targetId)
                    : groups.find(g => g.id === share.targetId);
                  if (!target) return null;

                  return (
                    <motion.div
                      key={share.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                    >
                      {isUser ? (
                        <TappableAvatar userId={share.targetId} emoji={(target as any).avatar}>
                          <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                            {(target as any).avatar}
                          </span>
                        </TappableAvatar>
                      ) : (
                        <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                          {(target as any).emoji}
                        </span>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{(target as any).name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {isUser ? (
                            <User className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <Users className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span className="text-[11px] text-muted-foreground capitalize">{share.targetType}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePrivacy(share.id)}
                        className="active:scale-95 transition-transform"
                      >
                        <PrivacyBadge privacy={share.privacy} />
                      </button>
                    </motion.div>
                  );
                })}

                {/* Privacy info */}
                <div className="mt-3 px-1">
                  <button
                    onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    What do privacy tiers mean?
                  </button>
                  <AnimatePresence>
                    {showPrivacyInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-4 rounded-xl border border-border bg-card space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-foreground">Privacy Tiers</h4>
                            <button onClick={() => setShowPrivacyInfo(false)} className="text-muted-foreground">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <EyeOff className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-foreground">Free / Busy</p>
                              <p className="text-[11px] text-muted-foreground">Others only see when you're available — no plan details</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <Eye className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-foreground">Full Details</p>
                              <p className="text-[11px] text-muted-foreground">Others can see plan names, locations, and times</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interests */}
        <section className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-2">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {['🏀 Sports', '🍽️ Dinner', '☕ Coffee', '🎾 Padel'].map(tag => (
              <span key={tag} className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground">
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Menu */}
        <div className="space-y-2 mb-6">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => handleMenuTap(item.label)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border transition-all border-border bg-card hover:bg-secondary"
              >
                <Icon className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            );
          })}
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm mb-8"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </AppLayout>
  );
};

function PrivacyBadge({ privacy }: { privacy: CalendarPrivacy }) {
  if (privacy === 'details') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-primary px-2.5 py-1 rounded-full bg-primary/10">
        <Eye className="w-3 h-3" />
        Details
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-accent px-2.5 py-1 rounded-full bg-accent/10">
      <EyeOff className="w-3 h-3" />
      Free/Busy
    </span>
  );
}

export default Profile;
