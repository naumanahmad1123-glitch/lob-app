import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Plus, ChevronRight, Sparkles, Globe, Lock, MapPin, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useComposer } from '@/hooks/useComposer';
import { AppLayout } from '@/components/layout/AppLayout';
import { trips as seedTrips, users, currentUser, lobs as seedLobs } from '@/data/seed';
import { TappableAvatar } from '@/components/TappableAvatar';
import { LobCard } from '@/components/lob/LobCard';
import { GroupTripComposer } from '@/components/trips/GroupTripComposer';
import { useCreatedLobs } from '@/hooks/useCreatedLobs';
import { useCreatedTrips } from '@/hooks/useCreatedTrips';
import { tripStore } from '@/stores/tripStore';
import { toast } from 'sonner';

const Trips = () => {
  const navigate = useNavigate();
  const { openComposer } = useComposer();
  const createdLobs = useCreatedLobs();
  const createdTrips = useCreatedTrips();
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showGroupTrip, setShowGroupTrip] = useState(false);
  const [newTrip, setNewTrip] = useState({ city: '', country: '', startDate: '', endDate: '', showOnProfile: true });

  const groupTripLobs = useMemo(
    () => [
      ...seedLobs.filter(l => l.category === 'group-trip'),
      ...createdLobs.filter(l => l.category === 'group-trip'),
    ],
    [createdLobs]
  );

  const allMyTrips = useMemo(() => [
    ...seedTrips.filter(t => t.userId === currentUser.id),
    ...createdTrips,
  ], [createdTrips]);
  const friendTrips = seedTrips.filter(t => t.userId !== currentUser.id && t.notifyUserIds.includes(currentUser.id));

  // Detect city overlaps
  const myTripDates = allMyTrips.filter(t => t.showOnProfile);
  const allVisibleFriendTrips = seedTrips.filter(t => t.userId !== currentUser.id && t.showOnProfile);

  const overlappingTrips = allVisibleFriendTrips.filter(ft => {
    return myTripDates.some(mt => {
      const sameCity = mt.city.toLowerCase() === ft.city.toLowerCase();
      const overlap = new Date(mt.startDate) <= new Date(ft.endDate) && new Date(mt.endDate) >= new Date(ft.startDate);
      return sameCity && overlap;
    });
  }).filter(ft => !friendTrips.some(f => f.id === ft.id));

  const allFriendTrips = [...friendTrips, ...overlappingTrips];

  const handleAddTrip = () => {
    if (!newTrip.city.trim() || !newTrip.startDate || !newTrip.endDate) {
      toast.error('Please fill in city, start and end dates');
      return;
    }
    const trip = {
      id: `trip-${Date.now()}`,
      userId: currentUser.id,
      city: newTrip.city,
      country: newTrip.country || '',
      emoji: '✈️',
      startDate: newTrip.startDate,
      endDate: newTrip.endDate,
      notifyUserIds: [] as string[],
      showOnProfile: newTrip.showOnProfile,
    };
    tripStore.addTrip(trip);
    toast.success(`Trip to ${newTrip.city} added!`);
    setShowAddTrip(false);
    setNewTrip({ city: '', country: '', startDate: '', endDate: '', showOnProfile: true });
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between pt-12 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Trips</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Travel plans & friend visits</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGroupTrip(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-bold active:scale-95 transition-transform"
            >
              <Users className="w-3.5 h-3.5" />
              Group Trip
            </button>
            <button
              onClick={() => setShowAddTrip(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Solo
            </button>
          </div>
        </div>

        {/* Add Trip Sheet */}
        <AnimatePresence>
          {showAddTrip && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddTrip(false)}
                className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[70] max-w-lg mx-auto"
              >
                <div className="bg-card rounded-t-3xl border border-border/50 shadow-card px-5 pb-8 pt-4">
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                  </div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-extrabold text-foreground">✈️ Add Trip</h2>
                    <button onClick={() => setShowAddTrip(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="City (e.g. London)"
                      value={newTrip.city}
                      onChange={e => setNewTrip(p => ({ ...p, city: e.target.value }))}
                      className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="Country (e.g. UK)"
                      value={newTrip.country}
                      onChange={e => setNewTrip(p => ({ ...p, country: e.target.value }))}
                      className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Start</label>
                        <input
                          type="date"
                          value={newTrip.startDate}
                          onChange={e => setNewTrip(p => ({ ...p, startDate: e.target.value }))}
                          className="w-full p-3 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">End</label>
                        <input
                          type="date"
                          value={newTrip.endDate}
                          onChange={e => setNewTrip(p => ({ ...p, endDate: e.target.value }))}
                          className="w-full p-3 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setNewTrip(p => ({ ...p, showOnProfile: !p.showOnProfile }))}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                    >
                      {newTrip.showOnProfile ? (
                        <Globe className="w-4 h-4 text-accent" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium text-foreground flex-1 text-left">
                        {newTrip.showOnProfile ? 'Visible on profile' : 'Private trip'}
                      </span>
                    </button>
                    <button
                      onClick={handleAddTrip}
                      className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
                    >
                      Add Trip
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Group Trip Composer */}
        <GroupTripComposer open={showGroupTrip} onClose={() => setShowGroupTrip(false)} />

        {/* Group Trips */}
        {groupTripLobs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-foreground mb-3">Group Trips</h2>
            <div className="space-y-3">
              {groupTripLobs.map((lob, i) => (
                <LobCard key={lob.id} lob={lob} index={i} />
              ))}
            </div>
          </section>
        )}

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
                          openComposer({ prefillUserIds: [trip.userId] });
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
