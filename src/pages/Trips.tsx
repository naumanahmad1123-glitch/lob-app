import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Plus, ChevronRight, Globe, Lock, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useComposer } from '@/hooks/useComposer';
import { AppLayout } from '@/components/layout/AppLayout';
import { LobCard } from '@/components/lob/LobCard';
import { GroupTripComposer } from '@/components/trips/GroupTripComposer';
import { useSupabaseLobs } from '@/hooks/useSupabaseLobs';
import { useSupabaseTrips, DbTrip } from '@/hooks/useSupabaseTrips';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const Trips = () => {
  const navigate = useNavigate();
  const { openComposer } = useComposer();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: allLobs = [] } = useSupabaseLobs();
  const { data: allTrips = [], isLoading } = useSupabaseTrips();
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showGroupTrip, setShowGroupTrip] = useState(false);
  const [newTrip, setNewTrip] = useState({ city: '', country: '', startDate: '', endDate: '', showOnProfile: true });
  const [saving, setSaving] = useState(false);

  const groupTripLobs = useMemo(() => allLobs.filter(l => l.category === 'group-trip'), [allLobs]);
  const myTrips = useMemo(() => allTrips.filter(t => t.user_id === user?.id), [allTrips, user]);
  const friendTrips = useMemo(() => allTrips.filter(t => t.user_id !== user?.id), [allTrips, user]);

  const handleAddTrip = async () => {
    if (!user || saving) return;
    if (!newTrip.city.trim() || !newTrip.startDate || !newTrip.endDate) {
      toast.error('Please fill in city, start and end dates');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('trips').insert({
        user_id: user.id,
        city: newTrip.city,
        country: newTrip.country || '',
        emoji: '✈️',
        start_date: newTrip.startDate,
        end_date: newTrip.endDate,
        show_on_profile: newTrip.showOnProfile,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['supabase-trips'] });
      toast.success(`Trip to ${newTrip.city} added!`);
      setShowAddTrip(false);
      setNewTrip({ city: '', country: '', startDate: '', endDate: '', showOnProfile: true });
    } catch (err: any) {
      toast.error('Failed to save trip: ' + err.message);
    } finally {
      setSaving(false);
    }
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
            <button onClick={() => setShowGroupTrip(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-bold active:scale-95 transition-transform">
              <Users className="w-3.5 h-3.5" /> Group Trip
            </button>
            <button onClick={() => setShowAddTrip(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold">
              <Plus className="w-3.5 h-3.5" /> Solo
            </button>
          </div>
        </div>

        {/* Add Trip Sheet */}
        <AnimatePresence>
          {showAddTrip && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: 'none' as any }} onClick={() => setShowAddTrip(false)} className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto">
                <div className="bg-card rounded-t-3xl border border-border/50 shadow-card px-5 pb-8 pt-4">
                  <div className="flex justify-center mb-3"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-extrabold text-foreground">✈️ Add Trip</h2>
                    <button onClick={() => setShowAddTrip(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                  <div className="space-y-3">
                    <input type="text" placeholder="City (e.g. London)" value={newTrip.city} onChange={e => setNewTrip(p => ({ ...p, city: e.target.value }))} className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" autoFocus />
                    <input type="text" placeholder="Country (e.g. UK)" value={newTrip.country} onChange={e => setNewTrip(p => ({ ...p, country: e.target.value }))} className="w-full p-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Start</label>
                        <input type="date" value={newTrip.startDate} onChange={e => setNewTrip(p => ({ ...p, startDate: e.target.value }))} className="w-full p-3 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">End</label>
                        <input type="date" value={newTrip.endDate} onChange={e => setNewTrip(p => ({ ...p, endDate: e.target.value }))} className="w-full p-3 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]" />
                      </div>
                    </div>
                    <button onClick={() => setNewTrip(p => ({ ...p, showOnProfile: !p.showOnProfile }))} className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                      {newTrip.showOnProfile ? <Globe className="w-4 h-4 text-accent" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                      <span className="text-sm font-medium text-foreground flex-1 text-left">{newTrip.showOnProfile ? 'Visible on profile' : 'Private trip'}</span>
                    </button>
                    <button onClick={handleAddTrip} disabled={saving} className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
                      {saving ? 'Saving...' : 'Add Trip'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <GroupTripComposer open={showGroupTrip} onClose={() => setShowGroupTrip(false)} />

        {groupTripLobs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-foreground mb-3">Group Trips</h2>
            <div className="space-y-3">{groupTripLobs.map((lob, i) => <LobCard key={lob.id} lob={lob} index={i} />)}</div>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-base font-bold text-foreground mb-3">Your Trips</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : myTrips.length > 0 ? (
            <div className="space-y-3">
              {myTrips.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                  className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card cursor-pointer active:scale-[0.98] hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{trip.emoji}</span>
                      <div>
                        <h3 className="font-semibold text-foreground text-[15px]">{trip.city}{trip.country ? `, ${trip.country}` : ''}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {trip.show_on_profile ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-accent px-2 py-0.5 rounded-full bg-accent/10"><Globe className="w-3 h-3" />Visible</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-secondary"><Lock className="w-3 h-3" />Private</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="gradient-card rounded-2xl border border-border/50 p-6 text-center">
              <Plane className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming trips</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Share your travel plans with friends</p>
            </div>
          )}
        </section>

        {friendTrips.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-foreground mb-3">Friends Visiting</h2>
            <div className="space-y-3">
              {friendTrips.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/trips/${trip.id}/friend`)}
                  className="gradient-card rounded-2xl p-4 border border-border/50 shadow-card cursor-pointer active:scale-[0.98] hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{trip.userAvatar || trip.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-foreground text-[15px]">{trip.userName || 'Friend'}</h3>
                        <span className="text-xs text-muted-foreground">→ {trip.city}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className="text-lg">{trip.emoji}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Trips;
