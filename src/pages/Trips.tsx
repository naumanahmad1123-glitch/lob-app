import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Plus, ChevronRight, Sparkles, Globe, Lock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { trips, users, currentUser } from '@/data/seed';
import { TappableAvatar } from '@/components/TappableAvatar';

const Trips = () => {
  const navigate = useNavigate();
  const myTrips = trips.filter(t => t.userId === currentUser.id);
  const friendTrips = trips.filter(t => t.userId !== currentUser.id && t.notifyUserIds.includes(currentUser.id));

  // Detect city overlaps: friends in same city at same time based on visible trips
  const myTripDates = myTrips.filter(t => t.showOnProfile);
  const allVisibleFriendTrips = trips.filter(t => t.userId !== currentUser.id && t.showOnProfile);

  const overlappingTrips = allVisibleFriendTrips.filter(ft => {
    return myTripDates.some(mt => {
      const sameCity = mt.city.toLowerCase() === ft.city.toLowerCase();
      const overlap = new Date(mt.startDate) <= new Date(ft.endDate) && new Date(mt.endDate) >= new Date(ft.startDate);
      return sameCity && overlap;
    });
  }).filter(ft => !friendTrips.some(f => f.id === ft.id)); // exclude already-shared ones

  const allFriendTrips = [
    ...friendTrips,
    ...overlappingTrips,
  ];

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between pt-12 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Trips</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Travel plans & friend visits</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold">
            <Plus className="w-3.5 h-3.5" />
            Add Trip
          </button>
        </div>

        {/* Your Trips */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-foreground mb-3">Your Trips</h2>
          {myTrips.length > 0 ? (
            <div className="space-y-3">
              {myTrips.map((trip, i) => {
                const notifiedUsers = users.filter(u => trip.notifyUserIds.includes(u.id));
                return (
                  <motion.button
                    key={trip.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/trips/${trip.id}`)}
                    className="w-full text-left gradient-card rounded-2xl p-4 border border-border/50 shadow-card active:scale-[0.98] transition-transform"
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
                      <div className="flex items-center gap-2">
                        {trip.showOnProfile ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-accent px-2 py-0.5 rounded-full bg-accent/10">
                            <Globe className="w-3 h-3" />
                            Visible
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                            <Lock className="w-3 h-3" />
                            Private
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[11px] text-muted-foreground">Shared with:</span>
                      <div className="flex -space-x-1.5">
                        {notifiedUsers.slice(0, 4).map(u => (
                          <TappableAvatar key={u.id} userId={u.id} emoji={u.avatar}>
                            <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs border-2 border-card">
                              {u.avatar}
                            </span>
                          </TappableAvatar>
                        ))}
                        {notifiedUsers.length > 4 && (
                          <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-muted-foreground border-2 border-card">
                            +{notifiedUsers.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
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

        {/* Friends Visiting */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-foreground mb-3">Friends Visiting</h2>
          {allFriendTrips.length > 0 ? (
            <div className="space-y-3">
              {allFriendTrips.map((trip, i) => {
                const traveler = users.find(u => u.id === trip.userId);
                if (!traveler) return null;
                const isOverlap = overlappingTrips.some(ot => ot.id === trip.id);
                const dateStr = `${new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

                return (
                  <motion.button
                    key={trip.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    onClick={() => navigate(`/trips/${trip.id}/friend`)}
                    className="w-full text-left gradient-card rounded-2xl p-4 border border-border/50 shadow-card active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <TappableAvatar userId={traveler.id} emoji={traveler.avatar}>
                        <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                          {traveler.avatar}
                        </span>
                      </TappableAvatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-[15px]">
                          {traveler.name} → {trip.city} {trip.emoji}
                        </h3>
                        <p className="text-xs text-muted-foreground">{dateStr}</p>
                      </div>
                    </div>

                    {isOverlap && (
                      <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[11px] font-medium text-primary">You'll both be in {trip.city}!</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {traveler.name} is in {trip.city} {dateStr} — make a plan?
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/create');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full gradient-primary text-xs font-semibold text-primary-foreground shrink-0 ml-2"
                      >
                        <Sparkles className="w-3 h-3" />
                        Lob
                      </button>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="gradient-card rounded-2xl border border-border/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">No friends travelling near you</p>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default Trips;
