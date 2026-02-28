import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, CalendarDays, Plus, ChevronRight, Eye, EyeOff, Users, User, Globe, Lock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { trips, calendarShares, users, groups, currentUser } from '@/data/seed';
import { CalendarPrivacy } from '@/data/types';

type Tab = 'trips' | 'calendar';

const Sharing = () => {
  const [tab, setTab] = useState<Tab>('trips');
  const myTrips = trips.filter(t => t.userId === currentUser.id);
  const friendTrips = trips.filter(t => t.userId !== currentUser.id && t.notifyUserIds.includes(currentUser.id));

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between pt-12 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Sharing</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Trips & availability</p>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab('trips')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'trips' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <Plane className="w-4 h-4" />
            Trips
          </button>
          <button
            onClick={() => setTab('calendar')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'calendar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Calendar
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'trips' ? (
            <motion.div
              key="trips"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* My trips */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-foreground">Your Trips</h2>
                  <button className="flex items-center gap-1 text-xs font-semibold text-primary">
                    <Plus className="w-3.5 h-3.5" />
                    Add Trip
                  </button>
                </div>
                {myTrips.length > 0 ? (
                  <div className="space-y-3">
                    {myTrips.map((trip, i) => {
                      const notifiedUsers = users.filter(u => trip.notifyUserIds.includes(u.id));
                      return (
                        <motion.div
                          key={trip.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl">{trip.emoji}</span>
                              <div>
                                <h3 className="font-semibold text-foreground text-[15px]">
                                  {trip.city}, {trip.country}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {' – '}
                                  {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
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
                          </div>

                          {/* Notified contacts */}
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-[11px] text-muted-foreground">Shared with:</span>
                            <div className="flex -space-x-1.5">
                              {notifiedUsers.slice(0, 4).map(u => (
                                <span key={u.id} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs border-2 border-card">
                                  {u.avatar}
                                </span>
                              ))}
                              {notifiedUsers.length > 4 && (
                                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-muted-foreground border-2 border-card">
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
                  <div className="gradient-card rounded-2xl border border-border/50 p-6 text-center">
                    <Plane className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming trips</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Share your travel plans with friends</p>
                  </div>
                )}
              </section>

              {/* Friends' trips */}
              <section className="mb-8">
                <h2 className="text-base font-bold text-foreground mb-3">Friends Visiting</h2>
                {friendTrips.length > 0 ? (
                  <div className="space-y-3">
                    {friendTrips.map((trip, i) => {
                      const traveler = users.find(u => u.id === trip.userId);
                      if (!traveler) return null;
                      return (
                        <motion.div
                          key={trip.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                          className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                              {traveler.avatar}
                            </span>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground text-[15px]">
                                {traveler.name} → {trip.city} {trip.emoji}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {' – '}
                                {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="gradient-card rounded-2xl border border-border/50 p-6 text-center">
                    <p className="text-sm text-muted-foreground">No friends travelling near you</p>
                  </div>
                )}
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Calendar sharing */}
              <section className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-foreground">Sharing With</h2>
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
                        <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                          {isUser ? (target as any).avatar : (target as any).emoji}
                        </span>
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
                        <PrivacyBadge privacy={share.privacy} />
                      </motion.div>
                    );
                  })}
                </div>
              </section>

              {/* Privacy tiers explainer */}
              <section className="mb-8">
                <h3 className="text-sm font-bold text-foreground mb-3">Privacy Tiers</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mt-0.5">
                      <EyeOff className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Free / Busy</p>
                      <p className="text-xs text-muted-foreground">Others only see when you're available or busy — no plan details</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                      <Eye className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Full Details</p>
                      <p className="text-xs text-muted-foreground">Others can see your plan names, locations, and times</p>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
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

export default Sharing;
