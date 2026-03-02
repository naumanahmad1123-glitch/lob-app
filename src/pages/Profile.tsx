import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronRight, Bell, Calendar, Shield, Crown, LogOut, Plane, CalendarDays, Plus, Eye, EyeOff, Users, User as UserIcon, Globe, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { currentUser, trips, calendarShares, users, groups } from '@/data/seed';
import { CalendarPrivacy } from '@/data/types';

const menuItems = [
  { icon: Bell, label: 'Notifications', desc: 'Manage alerts' },
  { icon: Calendar, label: 'Calendar Sync', desc: 'Connect calendars' },
  { icon: Shield, label: 'Privacy', desc: 'Control your data' },
  { icon: Crown, label: 'Upgrade to Pro', desc: 'Unlock advanced features', highlight: true },
];

type SharingTab = 'trips' | 'calendar';

const Profile = () => {
  const navigate = useNavigate();
  const activeTrips = trips.filter(t => t.userId === currentUser.id && t.showOnProfile);
  const [sharingTab, setSharingTab] = useState<SharingTab>('trips');

  const myTrips = trips.filter(t => t.userId === currentUser.id);
  const friendTrips = trips.filter(t => t.userId !== currentUser.id && t.notifyUserIds.includes(currentUser.id));

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between pt-12 pb-6">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Profile</h1>
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>

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
            <div>
              <p className="text-xl font-bold text-primary">92%</p>
              <p className="text-[11px] text-muted-foreground">Show Rate</p>
            </div>
          </div>

          {/* Active trip badge */}
          {activeTrips.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border/50">
              {activeTrips.map(trip => (
                <div
                  key={trip.id}
                  className="flex items-center gap-2 mx-auto px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 w-fit"
                >
                  <Plane className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-semibold text-accent">
                    {trip.emoji} {trip.city} · {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

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

        {/* Sharing Section */}
        <section className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3">Sharing</h3>
          <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 mb-4">
            <button
              onClick={() => setSharingTab('trips')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                sharingTab === 'trips' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Plane className="w-4 h-4" />
              Trips
            </button>
            <button
              onClick={() => setSharingTab('calendar')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                sharingTab === 'calendar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Calendar
            </button>
          </div>

          <AnimatePresence mode="wait">
            {sharingTab === 'trips' ? (
              <motion.div key="trips" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                {/* My trips */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">YOUR TRIPS</span>
                    <button className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                  {myTrips.length > 0 ? (
                    <div className="space-y-2">
                      {myTrips.map((trip, i) => {
                        const notifiedUsers = users.filter(u => trip.notifyUserIds.includes(u.id));
                        return (
                          <motion.div
                            key={trip.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="gradient-card rounded-xl p-3 border border-border/50 shadow-card"
                          >
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{trip.emoji}</span>
                                <div>
                                  <h4 className="font-semibold text-foreground text-sm">{trip.city}, {trip.country}</h4>
                                  <p className="text-[11px] text-muted-foreground">
                                    {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                              {trip.showOnProfile ? (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-accent px-2 py-0.5 rounded-full bg-accent/10">
                                  <Globe className="w-3 h-3" />
                                  Profile
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                                  <Lock className="w-3 h-3" />
                                  Private
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] text-muted-foreground">Shared with:</span>
                              <div className="flex -space-x-1.5">
                                {notifiedUsers.slice(0, 4).map(u => (
                                  <span key={u.id} className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] border-2 border-card">
                                    {u.avatar}
                                  </span>
                                ))}
                                {notifiedUsers.length > 4 && (
                                  <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[8px] font-bold text-muted-foreground border-2 border-card">
                                    +{notifiedUsers.length - 4}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border/50 p-4 text-center">
                      <p className="text-xs text-muted-foreground">No upcoming trips</p>
                    </div>
                  )}
                </div>

                {/* Friend trips */}
                {friendTrips.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground mb-2 block">FRIENDS VISITING</span>
                    <div className="space-y-2">
                      {friendTrips.map((trip, i) => {
                        const traveler = users.find(u => u.id === trip.userId);
                        if (!traveler) return null;
                        return (
                          <motion.div
                            key={trip.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                          >
                            <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-base">
                              {traveler.avatar}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-foreground">{traveler.name} → {trip.city} {trip.emoji}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="calendar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">SHARING WITH</span>
                    <button className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {calendarShares.map((share, i) => {
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
                          <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-base">
                            {isUser ? (target as any).avatar : (target as any).emoji}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">{(target as any).name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {isUser ? <UserIcon className="w-3 h-3 text-muted-foreground" /> : <Users className="w-3 h-3 text-muted-foreground" />}
                              <span className="text-[10px] text-muted-foreground capitalize">{share.targetType}</span>
                            </div>
                          </div>
                          <PrivacyBadge privacy={share.privacy} />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Privacy tiers */}
                <div className="mt-4">
                  <span className="text-xs font-semibold text-muted-foreground mb-2 block">PRIVACY TIERS</span>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                      <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center mt-0.5">
                        <EyeOff className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Free / Busy</p>
                        <p className="text-[11px] text-muted-foreground">Others only see when you're available</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                        <Eye className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Full Details</p>
                        <p className="text-[11px] text-muted-foreground">Others can see plan names, locations, and times</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  item.highlight
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card hover:bg-secondary'
                }`}
              >
                <Icon className={`w-5 h-5 ${item.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex-1 text-left">
                  <p className={`text-sm font-semibold ${item.highlight ? 'text-primary' : 'text-foreground'}`}>{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            );
          })}
        </div>

        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm mb-8">
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
      <span className="flex items-center gap-1 text-[10px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10">
        <Eye className="w-3 h-3" />
        Details
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-accent px-2 py-0.5 rounded-full bg-accent/10">
      <EyeOff className="w-3 h-3" />
      Free/Busy
    </span>
  );
}

export default Profile;
